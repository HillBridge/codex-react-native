import type { ProductDetail, ProductFilter, ProductSummary } from '@/features/products/types';

const catalogProducts: ProductDetail[] = [
  {
    id: 'prd_001',
    slug: 'aero-desk-lamp',
    name: 'Aero Desk Lamp',
    series: 'Workline',
    category: '家居',
    summary: '一盏适合长时间工作和阅读的低眩光台灯。',
    description:
      'Aero Desk Lamp 使用多段色温和柔光扩散结构，让工作、阅读和夜间整理都保持稳定舒适的照明体验。',
    price: 699,
    stock: 34,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
    highlights: ['低眩光扩散灯罩', '三档色温记忆', '金属转轴支撑'],
  },
  {
    id: 'prd_002',
    slug: 'terra-weekender-pack',
    name: 'Terra Weekender Pack',
    series: 'Field',
    category: '户外',
    summary: '能装下两日出行装备的轻量背包。',
    description:
      'Terra Weekender Pack 为短途旅行和城市通勤设计，拥有独立电脑仓、防泼水面料和快速取物侧袋。',
    price: 899,
    stock: 18,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=80',
    highlights: ['28L 主仓容量', '防泼水尼龙面料', '独立电脑保护仓'],
  },
  {
    id: 'prd_003',
    slug: 'pulse-mini-speaker',
    name: 'Pulse Mini Speaker',
    series: 'Sound',
    category: '数码',
    summary: '适合桌面和露营场景的紧凑蓝牙音箱。',
    description:
      'Pulse Mini Speaker 兼顾体积和声场，支持双音箱组队和 16 小时播放，适合工作桌面与户外场景。',
    price: 529,
    stock: 46,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80',
    highlights: ['16 小时续航', 'IPX5 防水', '双音箱立体声'],
  },
  {
    id: 'prd_004',
    slug: 'linen-everyday-shirt',
    name: 'Linen Everyday Shirt',
    series: 'Daily',
    category: '穿搭',
    summary: '适合通勤和周末穿着的亚麻衬衫。',
    description:
      'Linen Everyday Shirt 使用柔软亚麻混纺面料，版型利落但不紧绷，可以轻松覆盖办公室和周末出行。',
    price: 469,
    stock: 63,
    featured: false,
    image:
      'https://images.unsplash.com/photo-1520975682031-ae8298d0f8c7?auto=format&fit=crop&w=1200&q=80',
    highlights: ['亚麻混纺面料', '免烫整理工艺', '适中宽松版型'],
  },
  {
    id: 'prd_005',
    slug: 'modular-cable-kit',
    name: 'Modular Cable Kit',
    series: 'Desk',
    category: '数码',
    summary: '让桌面充电和数据线更清爽的一体套装。',
    description: 'Modular Cable Kit 包含高速线材、磁吸理线器和桌面固定座，适合多设备办公桌。',
    price: 239,
    stock: 91,
    featured: false,
    image:
      'https://images.unsplash.com/photo-1603539444875-76e7684265f6?auto=format&fit=crop&w=1200&q=80',
    highlights: ['100W 快充支持', '磁吸理线模块', '耐弯折编织线'],
  },
  {
    id: 'prd_006',
    slug: 'canvas-market-tote',
    name: 'Canvas Market Tote',
    series: 'Daily',
    category: '穿搭',
    summary: '结实、轻便、可以每天使用的帆布托特包。',
    description:
      'Canvas Market Tote 使用高密度棉帆布和加固底部设计，兼顾日常通勤、购物和短途携带。',
    price: 199,
    stock: 120,
    featured: false,
    image:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce5?auto=format&fit=crop&w=1200&q=80',
    highlights: ['高密度棉帆布', '底部加固结构', '内部分区口袋'],
  },
];

const mockProducts: ProductDetail[] = catalogProducts.map((product) => ({ ...product, image: '' }));

export function getMockProducts(filter: ProductFilter = {}): ProductSummary[] {
  const q = filter.q?.trim().toLowerCase() || '';

  return mockProducts
    .filter((product) => {
      if (filter.featured === true && !product.featured) return false;
      if (filter.featured === false && product.featured) return false;
      if (filter.category && product.category !== filter.category) return false;

      return (
        !q ||
        [product.name, product.series, product.category, product.summary]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    })
    .map(
      ({ description: _description, highlights: _highlights, stock: _stock, ...summary }) =>
        summary,
    );
}

export function getMockProduct(slug: string): ProductDetail | undefined {
  return mockProducts.find((product) => product.slug === slug);
}
