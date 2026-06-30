import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_EVENTS = [
  {
    titleEn: 'Saffron Tasting & Tapas Night',
    titleEs: 'Noche de Tapas y Cata de Azafrán',
    titleCat: 'Nit de Tapes i Tast de Safrà',
    date: '2026-10-24',
    time: '19:30 - 22:30',
    location: 'Kasa Saffron Croqueteria, Barcelona',
    descEn: 'Join us for an exclusive evening of culinary delight. Experience a guided tasting of our premium saffron-infused croquetas, paired perfectly with curated Spanish wines. Meet our founders and discover the secrets behind our artisanal recipes.',
    descEs: 'Únete a nosotros para una velada exclusiva de placer culinario. Experimenta una cata guiada de nuestras croquetas premium infusionadas con azafrán.',
    descCat: 'Uneix-te a nosaltres per a una vetllada exclusiva de plaer culinari. Experimenta una tast guiat de les nostres croquetes premium infusionades amb safrà.',
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop',
    isPublished: true,
  },
];

const DEFAULT_FLAVOURS = [
  { name: { en: 'Classic Jamón Ibérico', es: 'Clásico Jamón Ibérico', cat: 'Clàssic Pernil Ibèric' }, tagline: { en: 'The Soul of Spain', es: 'El Alma de España', cat: "L'Ànima d'Espanya" }, description: { en: 'Traditional Spanish croqueta filled with rich, savory Iberian cured ham in a creamy, melt-in-your-mouth bechamel sauce.', es: 'Croqueta tradicional española rellena de rico y sabroso jamón ibérico curado en una salsa bechamel cremosa.', cat: 'Croqueta tradicional espanyola farcida de ric i saborós pernil ibèric curat.' }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/b673c1e0-5ef3-46e8-b80c-761dcb98a422.jpg', spanishName: 'Croquetas de Jamón Ibérico', price500g: 12, price1kg: 20 },
  { name: { en: 'Earthy Boletus Mushrooms', es: 'Boletus Terrosos', cat: 'Boletus Terrosos' }, tagline: { en: 'Wild & Velvety', es: 'Silvestre y Aterciopelado', cat: 'Silvestre i Vellutat' }, description: { en: 'Sautéed wild porcini mushrooms blended into a smooth cream — a vegetarian specialty rich in deep forest aroma.', es: 'Champiñones porcini silvestres salteados mezclados en una crema suave.', cat: 'Xampinyons porcini silvestres saltejats barrejats en una crema suau.' }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/05d19617-71ac-4d56-b725-7a97d472753a.jpg', spanishName: 'Croquetas de Ceps', price500g: 12, price1kg: 20 },
  { name: { en: 'Traditional Cod (Bacalao)', es: 'Bacalao Tradicional', cat: 'Bacallà Tradicional' }, tagline: { en: 'A Coastal Heritage', es: 'Una Herencia Costera', cat: 'Una Herència Costanera' }, description: { en: 'A coastal tapas classic featuring finely flaked salted cod, garlic, and fresh parsley, fried to crisp golden perfection.', es: 'Un clásico de las tapas costeras con bacalao salado finamente desmenuzado.', cat: 'Un clàssic de les tapes costaneres amb bacallà salat finament esmicolat.' }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/aae40670-49c9-4429-a7ef-6b03d30f607d.jpg', spanishName: 'Croquetas de Bacalao', price500g: 12, price1kg: 20 },
  { name: { en: 'Signature Chicken & Saffron', es: 'Pollo de Autor y Azafrán', cat: "Pollastre d'Autor i Safrà" }, tagline: { en: 'Infused with Elegance', es: 'Infusionado con Elegancia', cat: 'Infusionat amb Elegància' }, description: { en: 'Our house specialty: tender slow-roasted chicken breast infused with the delicate aroma of premium hand-picked saffron threads.', es: 'Nuestra especialidad de la casa: tierna pechuga de pollo asada a fuego lento infusionada con azafrán.', cat: 'La nostra especialitat de la casa: tendra pit de pollastre rostit infusionat amb safrà.' }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/e498b324-4ad5-4846-ab19-090e600c327d.jpg', spanishName: 'Croquetas de Pollo Rustido', price500g: 12, price1kg: 20 },
  { name: { en: 'Creamy Cabrales Blue Cheese', es: 'Cremoso Queso Azul Cabrales', cat: 'Cremós Formatge Blau Cabrales' }, tagline: { en: 'Bold & Indulgent', es: 'Audaz e Indulgente', cat: 'Audaç i Indulgent' }, description: { en: 'A daring bite featuring Spanish blue cheese, beautifully balanced with sweet caramelized onions for a sweet-savory harmony.', es: 'Un bocado atrevido con queso azul español equilibrado con cebollas caramelizadas.', cat: 'Un mos atrevit amb formatge blau espanyol equilibrat amb cebes caramel·litzades.' }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/c524ba36-7841-4226-9dec-5f968db77dbe.jpg', spanishName: 'Croquetas de Queso Azul', price500g: 12, price1kg: 20 },
  { name: { en: 'Spinach & Roasted Pine Nuts', es: 'Espinacas y Piñones Tostados', cat: 'Espinacs i Pinyons Torrats' }, tagline: { en: 'Clean & Crispy', es: 'Limpio y Crujiente', cat: 'Net i Cruixent' }, description: { en: 'Fresh spinach leaves and toasted Spanish pine nuts folded into our light bechamel, offering a clean, nutty finish.', es: 'Hojas frescas de espinaca y piñones españoles tostados en nuestra ligera bechamel.', cat: 'Fulles fresques d\'espinac i pinyons espanyols torrats en la nostra lleugera beixamel.' }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/d943190d-131f-4f4d-b77c-52fee772d387.png', spanishName: 'Croquetas de Espinaca', price500g: 12, price1kg: 20 },
  { name: { en: 'Slow-Cooked Oxtail (Rabo de Toro)', es: 'Rabo de Toro Cocinado a Fuego Lento', cat: 'Cua de Bou Cuinada a Foc Lent' }, tagline: { en: 'Rich & Deep', es: 'Rico y Profundo', cat: 'Ric i Profund' }, description: { en: 'Melt-in-your-mouth shredded oxtail beef braised in Spanish red wine, encased in an ultra-crispy breadcrumb crust.', es: 'Carne de rabo de toro desmenuzada que se deshace en la boca, estofada en vino tinto español.', cat: 'Carn de cua de bou esmicolada ofegada en vi negre espanyol.' }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/68a46dec-c542-41ba-a695-31b8e3934df3.jpeg', spanishName: 'Croquetas de Cocido', price500g: 12, price1kg: 20 },
  { name: { en: 'Garlic Shrimp (Gambas al Ajillo)', es: 'Gambas al Ajillo', cat: "Gambes a l'Allet" }, tagline: { en: 'Zesty Tapas Sensation', es: 'Sensación Dinámica de Tapas', cat: 'Sensació Dinàmica de Tapes' }, description: { en: 'Plump prawns sautéed in garlic-infused olive oil with a touch of red pepper flakes, bringing hot tapas direct to you.', es: 'Carnosas gambas salteadas en aceite de oliva infusionado con ajo y un toque de pimiento rojo.', cat: "Carnoses gambes saltejades en oli d'oliva infusionat amb all i un toc de pebre vermell." }, image: 'https://kasasaffron.com/api/files/kasa-saffron/uploads/9c49d2af-323a-454b-82f1-9301da2b74a7.jpg', spanishName: 'Croquetas de Rape y Gambas', price500g: 12, price1kg: 20 },
];

const DEFAULT_GALLERY = [
  { nameEn: 'Fresh Preparation', nameEs: 'Preparación Fresca', nameCat: 'Preparació Fresca', taglineEn: 'Handcrafted Daily', taglineEs: 'Hecho a Mano a Diario', taglineCat: 'Fet a Mà Diàriament', imageUrl: '/assets/gallery-1.png', sortOrder: 1 },
  { nameEn: 'Premium Saffron Box', nameEs: 'Caja de Azafrán Premium', nameCat: 'Caixa de Safrà Prèmium', taglineEn: 'Ready for Delivery', taglineEs: 'Lista para Entrega', taglineCat: 'Llesta per a Entrega', imageUrl: '/assets/gallery-2.png', sortOrder: 2 },
  { nameEn: 'Perfect Crisp', nameEs: 'Crujiente Perfecto', nameCat: 'Cruixent Perfecte', taglineEn: 'Golden & Delicious', taglineEs: 'Dorado y Delicioso', taglineCat: 'Daurat i Deliciós', imageUrl: '/assets/gallery-3.png', sortOrder: 3 },
  { nameEn: 'Catering Pack', nameEs: 'Pack de Catering', nameCat: 'Pack de Càtering', taglineEn: 'For Any Occasion', taglineEs: 'Para Cualquier Ocasión', taglineCat: 'Per a Qualsevol Ocasió', imageUrl: '/assets/gallery-4.png', sortOrder: 4 },
  { nameEn: 'Signature Finish', nameEs: 'Acabado de Autor', nameCat: "Acabat d'Autor", taglineEn: 'The Kasa Standard', taglineEs: 'El Estándar Kasa', taglineCat: "L'Estàndard Kasa", imageUrl: '/assets/gallery-5.png', sortOrder: 5 },
];

const DEFAULT_ABOUT = {
  intro1: { en: 'At Kasa Saffron Croqueteria Y Catering, we transform a traditional Spanish recipe into a contemporary gourmet experience. We were born with a clear vision: to offer high-quality artisanal croquettes, made with selected ingredients and meticulously careful processes.', es: 'En Kasa Saffron Croqueteria Y Catering transformamos una receta tradicional española en una experiencia gourmet contemporánea.', cat: 'A Kasa Saffron Croqueteria Y Catering transformem una recepta tradicional espanyola en una experiència gurmet contemporània.' },
  intro2: { en: 'Each croquette represents a balance between texture, flavor, and presentation. Our production combines traditional techniques with modern standards of hygiene and consistency.', es: 'Cada croqueta representa un equilibrio entre textura, sabor y presentación. Nuestra producción combina técnicas tradicionales con estándares modernos.', cat: 'Cada croqueta representa un equilibri entre textura, sabor i presentació. La nostra producció combina tècniques tradicionals amb estàndards moderns.' },
  feat1Title: { en: 'OUR ESSENCE', es: 'NUESTRA ESENCIA', cat: 'LA NOSTRA ESSÈNCIA' },
  feat1Desc: { en: 'Each croquette represents a balance between texture, flavor, and presentation. Our production combines traditional techniques with modern standards of hygiene and consistency.', es: 'Cada croqueta representa un equilibrio entre textura, sabor y presentación.', cat: 'Cada croqueta representa un equilibri entre textura, sabor i presentació.' },
  feat2Title: { en: 'OUR COMMITMENT', es: 'NUESTRO COMPROMISO', cat: 'EL NOSTRE COMPROMÍS' },
  feat2Desc: { en: 'We guarantee a homogeneous product for both the final customer and professional catering, always committed to quality, authenticity, and attention to detail.', es: 'Garantizamos un producto homogéneo comprometido con la calidad y la autenticidad.', cat: 'Garantim un producte homogeni compromès amb la qualitat i autenticitat.' },
  chetnaRole: { en: 'Chef / Director / Founder', es: 'Chef / Directora / Fundadora', cat: 'Xef / Directora / Fundadora' },
  chetnaP1: { en: "Chetna's passion for cooking began in her father's kitchen in India, where she learned the art of combining spices and creating memorable flavors.", es: 'La pasión de Chetna por la cocina comenzó en la cocina de su padre en India.', cat: "La passió de Chetna per la cuina va començar a la cuina del seu pare a l'Índia." },
  chetnaP2: { en: "After training at Barcelona's best culinary schools and specializing in pastry, Chetna decided to create Kasa Saffron as a tribute to her roots.", es: 'Tras formarse en las mejores escuelas culinarias de Barcelona, Chetna decidió crear Kasa Saffron.', cat: "Després de formar-se a les millors escoles culinàries de Barcelona, Chetna va crear Kasa Saffron." },
  chetnaP3: { en: 'Her vision is simple but ambitious: to transform the humble croquette into a first-class gastronomic experience.', es: 'Su visión es simple pero ambiciosa: transformar la humilde croqueta en una experiencia gastronómica de primer nivel.', cat: 'La seva visió és simple però ambiciosa: transformar la humil croqueta en una experiència gastronòmica de primer nivell.' },
  lovieshRole: { en: 'Executive Chef', es: 'Chef Ejecutivo', cat: 'Xef Executiu' },
  lovieshP1: { en: 'With culinary training in Switzerland and professional experience at some of the world\'s most prestigious luxury hotels, Loviesh brings an unparalleled level of excellence.', es: 'Con formación culinaria en Suiza y experiencia en algunos de los hoteles de lujo más prestigiosos del mundo.', cat: 'Amb formació culinària a Suïssa i experiència en alguns dels hotels de luxe més prestigiosos del món.' },
  lovieshP2: { en: 'His career includes positions in the United States, Switzerland, and Spain, culminating with a master\'s in hotel management.', es: 'Su carrera incluye posiciones en los Estados Unidos, Suiza y España.', cat: "La seva carrera inclou posicions als Estats Units, Suïssa i Espanya." },
  chefImage: '/Images/history_chef.jpg',
  founderImage: '/Images/founder_pngggg.png',
  lovieshImage: '/Images/gordanramsi png.png',
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Super Admin User
  const adminEmail = '12345admin@gmail.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('071976', 10);
    await prisma.user.create({
      data: {
        name: 'Kasa Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
      },
    });
    console.log('✅ Created Super Admin user');
  }

  // 2. Clear existing content to avoid duplicates on re-run
  await prisma.product.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.galleryImage.deleteMany({});
  await prisma.siteContent.deleteMany({});

  // 3. Seed Flavours
  for (const flavour of DEFAULT_FLAVOURS) {
    await prisma.product.create({
      data: {
        name: flavour.name,
        tagline: flavour.tagline,
        description: flavour.description,
        image: flavour.image,
        spanishName: flavour.spanishName,
        price500g: flavour.price500g,
        price1kg: flavour.price1kg,
        stock: 999,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`✅ Seeded ${DEFAULT_FLAVOURS.length} flavours`);

  // 4. Seed Events
  for (const event of DEFAULT_EVENTS) {
    await prisma.event.create({
      data: event,
    });
  }
  console.log(`✅ Seeded ${DEFAULT_EVENTS.length} events`);

  // 5. Seed Gallery
  for (const img of DEFAULT_GALLERY) {
    await prisma.galleryImage.create({
      data: img,
    });
  }
  console.log(`✅ Seeded ${DEFAULT_GALLERY.length} gallery images`);

  // 6. Seed Site Content (About page)
  const aboutEntries = [];
  for (const [key, value] of Object.entries(DEFAULT_ABOUT)) {
    if (typeof value === 'object') {
      // It's multi-lingual text {en, es, cat}
      for (const [lang, text] of Object.entries(value)) {
        aboutEntries.push({ section: 'about', lang, key, value: text });
      }
    } else {
      // It's a simple string (like an image URL)
      aboutEntries.push({ section: 'about', lang: 'en', key, value: String(value) });
    }
  }

  await prisma.siteContent.createMany({
    data: aboutEntries,
    skipDuplicates: true,
  });
  console.log(`✅ Seeded About content`);

  console.log('✨ Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
