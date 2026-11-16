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

const registeredProducers: any[] = [
  {
    id: 'shg-01',
    businessName: 'Mahila Shakti SHG',
    category: 'SHG',
    contactPerson: 'Sita Devi',
    phone: '+91 94312 99881',
    city: 'Ranchi',
    state: 'Jharkhand',
    products: 'Handmade Aam Ka Achar, Lemon Pickle, Sattu',
    status: 'VERIFIED_ACTIVE',
    rating: 4.9,
    ordersSupplied: 342,
  },
  {
    id: 'shg-02',
    businessName: 'Gramin Vikas Kisan Mandal',
    category: 'SHG',
    contactPerson: 'Babulal Marandi',
    phone: '+91 94315 77662',
    city: 'Khunti',
    state: 'Jharkhand',
    products: 'Pure Desi Bilona Cow Ghee, Wild Honey',
    status: 'VERIFIED_ACTIVE',
    rating: 4.8,
    ordersSupplied: 512,
  }
];

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
