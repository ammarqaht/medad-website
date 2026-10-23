/* All site copy lives here (NFR-18). Pages and components never hardcode text.
   Copy rules (MEDAD.md §4): no em/en dashes or "--", no eyebrow labels, no
   badges, no emojis, no English except links, no numbers about Medad. */

export const WHATSAPP = 'https://wa.me/966535451898';

export const site = {
  meta: {
    title: '{مداد}',
    description: '{مداد} تصمّم المواقع والأنظمة والتجارب التفاعلية وتبنيها بعناية.',
  },

  nav: {
    home: 'الرئيسية',
    works: 'الأعمال',
    cta: 'تواصل معنا',
    skip: 'تخطَّ إلى المحتوى',
  },

  home: {
    title: '{مداد}',
    headline: 'نكتب فكرتك منصة تعمل',
    line: 'نصمّم المواقع والأنظمة الرقمية ونبنيها، ونصنع تجارب حيّة تجمع الناس.',
    cta: 'ابدأ فكرتك معنا',
    works: 'شاهد أعمالنا',
  },

  works: {
    title: 'الأعمال',
    headline: 'أعمال تعمل',
    line: 'كل عمل هنا نسخة تجريبية تستطيع أن تجرّبها بنفسك.',
    arms: [
      {
        title: 'حلول رقمية',
        items: [
          { name: 'حلقة', kind: 'أنظمة' },
          { name: 'تسيير: التسجيل', kind: 'منصات تسيير' },
          { name: 'تسيير: التحفيز', kind: 'منصات تسيير' },
          { name: 'إنجاز', kind: 'منصات إنجاز' },
        ],
      },
      {
        title: 'تجارب حية',
        items: [{ name: 'نبضة', kind: 'مسابقات' }],
      },
    ],
  },

  notFound: {
    title: 'لم يصل الحبر إلى هنا',
    line: 'الصفحة التي تبحث عنها غير موجودة. لنعد بك إلى ما كُتب.',
    home: 'إلى الرئيسية',
    works: 'إلى الأعمال',
  },

  footer: {
    line: 'حلول تقنية تُكتب بعناية.',
    cta: 'راسلنا على واتساب',
    copyright: '© 2026 {مداد}',
  },
};
