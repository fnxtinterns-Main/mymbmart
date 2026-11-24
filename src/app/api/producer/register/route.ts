import { NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

interface ProducerInput {
  businessName: string;
  category: 'SHG' | 'MERCHANT' | 'CLOUD_KITCHEN' | 'WOMEN_ENTREPRENEUR';
  contactPerson: string;
  phone: string;
  city: string;
  state?: string;
  productDescription: string;
  bankAccount?: string;
  ifscCode?: string;
}

const registeredProducers: any[] = [];

export async function GET(req: Request) {
  let list = registeredProducers;
  try {
    const cached = await redisGet<any[]>('producers:list');
    if (cached && Array.isArray(cached) && cached.length > 0) {
      list = cached;
    }
  } catch {}

  const isAdmin = isAdminAuthorized(req);
  const safeList = list.map((item) => {
    if (isAdmin) return item;
    const { bankAccount, ifscCode, ...publicInfo } = item;
    return publicInfo;
  });

  return NextResponse.json({
    success: true,
    totalProducers: safeList.length,
    producers: safeList,
  });
}

export async function POST(req: Request) {
  try {
    const body: ProducerInput = await req.json();
    const { businessName, category, contactPerson, phone, city, productDescription } = body;

    if (!businessName || !phone || !contactPerson) {
      return NextResponse.json(
        { error: 'Business Name, Contact Person, and Phone are mandatory.' },
        { status: 400 }
      );
    }

    const newProducer = {
      id: 'prod-' + Date.now(),
      businessName,
      category: category || 'SHG',
      contactPerson,
      phone,
      city: city || 'Ranchi',
      state: body.state || 'Jharkhand',
      products: productDescription || 'Handmade goods',
      status: 'PENDING_DOCUMENT_VERIFICATION',
      submittedAt: new Date().toISOString(),
    };

    registeredProducers.unshift(newProducer);

    // 1. Persist to Upstash Redis
    try {
      const existing = (await redisGet<any[]>('producers:list')) || [];
      existing.unshift(newProducer);
      await redisSet('producers:list', existing.slice(0, 100));
    } catch {}

    // 2. Persist to PostgreSQL if connected
    try {
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.upsert({
        where: { phone },
        update: { name: contactPerson },
        create: {
          memberId: 'SHG' + Math.floor(100000 + Math.random() * 900000),
          referralCode: 'SHG' + Math.floor(100000 + Math.random() * 900000),
          name: contactPerson,
          phone,
          role: 'SHG_PRODUCER',
        },
      });

      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          businessName,
          isSHG: category === 'SHG',
          shgGroupName: category === 'SHG' ? businessName : null,
          city: city || 'Ranchi',
          state: body.state || 'Jharkhand',
          isVerified: false,
        },
      });
    } catch (dbErr) {
      // Safe fallback if relational constraint or duplicate profile
    }

    return NextResponse.json({
      success: true,
      message: 'Application received successfully! Our Field Coordinator will visit for product sampling within 48 hours.',
      producer: newProducer,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
