import { NextResponse } from 'next/server';

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

export async function GET() {
  return NextResponse.json({
    success: true,
    totalProducers: registeredProducers.length,
    producers: registeredProducers,
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

    return NextResponse.json({
      success: true,
      message: 'Application received successfully! Our Field Coordinator will visit for product sampling within 48 hours.',
      producer: newProducer,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
