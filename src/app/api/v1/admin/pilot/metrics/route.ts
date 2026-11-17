import { NextResponse } from 'next/server';

export async function GET() {
  const pilotData = {
    city: 'Ranchi, Jharkhand',
    durationDays: 90,
    currentDay: 14,
    status: 'ACTIVE_PILOT',
    decisionSignal: 'GREEN', // GREEN, YELLOW, RED
    kpis: {
      orderAcceptanceRate: { value: 95.8, target: 90.0, unit: '%', status: 'HEALTHY' },
      onTimeDeliveryRate: { value: 89.2, target: 85.0, unit: '%', status: 'HEALTHY' },
      orderSuccessRate: { value: 97.4, target: 95.0, unit: '%', status: 'HEALTHY' },
      averageDeliveryMinutes: { value: 34, target: 45, unit: 'min', status: 'HEALTHY' },
      shopRetention: { value: 100, target: 100, unit: '%', activeCount: 5, targetCount: 5, status: 'HEALTHY' },
      shgRetention: { value: 100, target: 100, unit: '%', activeCount: 3, targetCount: 3, status: 'HEALTHY' },
      partnerNps: { value: 46, target: 40, unit: 'NPS', status: 'HEALTHY' },
      shgIncomeIncrease: { value: 38.5, target: 30.0, unit: '%', status: 'HEALTHY' },
      customerRepeatRate: { value: 42.1, target: 40.0, unit: '%', status: 'HEALTHY' },
      settlementAccuracy: { value: 100.0, target: 100.0, unit: '%', status: 'HEALTHY' },
      disputeRate: { value: 0.8, target: 2.0, unit: '%', status: 'HEALTHY' },
      routingSuccessRate: { value: 96.2, target: 95.0, unit: '%', status: 'HEALTHY' },
      noShopRate: { value: 1.4, target: 3.0, unit: '%', status: 'HEALTHY' },
      activePincodes: { value: 5, target: 5, list: ['834001', '834002', '834004', '834005', '834008'], status: 'HEALTHY' },
    },
    partners: [
      {
        id: 'shop-rch-01',
        name: 'Sharma Retail Store',
        type: 'KIRANA_SHOP',
        pincode: '834001',
        onboardingStage: 'GO_LIVE',
        acceptanceRate: '96%',
        ordersDelivered: 42,
        settlementStatus: 'CURRENT',
      },
      {
        id: 'shop-rch-02',
        name: 'Gupta Super Grocery Mart',
        type: 'KIRANA_SHOP',
        pincode: '834004',
        onboardingStage: 'GO_LIVE',
        acceptanceRate: '91%',
        ordersDelivered: 28,
        settlementStatus: 'CURRENT',
      },
      {
        id: 'shop-rch-03',
        name: 'Verma Daily Mart & Bachat Kendra',
        type: 'KIRANA_SHOP',
        pincode: '834002',
        onboardingStage: 'GO_LIVE',
        acceptanceRate: '88%',
        ordersDelivered: 65,
        settlementStatus: 'CURRENT',
      },
      {
        id: 'shg-rch-01',
        name: 'Jharkhand Mahila Samakhya SHG',
        type: 'SHG_PRODUCER',
        pincode: '834008',
        hostShop: 'Sharma Retail Store',
        onboardingStage: 'GO_LIVE',
        activeSkus: 8,
        monthlyIncomeIncrease: '+₹4,200/member',
      },
      {
        id: 'shg-rch-02',
        name: 'Vanabandhu Tribal Producer Co-op',
        type: 'SHG_PRODUCER',
        pincode: '834001',
        hostShop: 'Ranchi Central Fulfilment Hub',
        onboardingStage: 'GO_LIVE',
        activeSkus: 6,
        monthlyIncomeIncrease: '+₹3,800/member',
      },
    ],
  };

  return NextResponse.json(pilotData, { status: 200 });
}
