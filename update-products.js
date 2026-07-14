import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const updates = [
  {
    id: "7f82b506-f201-4247-bca4-ad9218461a0a",
    name: { en: "Monkfish & Shrimp Croquettes", es: "Croquetas de Rape y Gambas", ca: "Croquetes de Rap i Gambes" },
    description: { en: "Tender monkfish and succulent shrimp blended into a creamy béchamel and coated in a crispy golden breadcrumb.", es: "Delicado rape y jugosas gambas mezclados con una cremosa bechamel y un crujiente rebozado dorado.", ca: "Delicat rap i sucoses gambes barrejats amb una cremosa beixamel i un cruixent arrebossat daurat." }
  },
  {
    id: "c5a6ff54-1f2e-4f06-a6e1-a4da19e27a34",
    name: { en: "Blue Cheese Croquettes", es: "Croquetas de Queso Azul", ca: "Croquetes de Formatge Blau" },
    description: { en: "Rich blue cheese folded into a smooth, creamy béchamel with a perfectly crisp golden coating.", es: "Intenso queso azul integrado en una suave bechamel, con un irresistible rebozado crujiente.", ca: "Intens formatge blau integrat en una suau beixamel amb un irresistible arrebossat cruixent." }
  },
  {
    id: "4d063582-b42a-4976-b2cf-b20eed582727",
    name: { en: "Traditional Spanish Stew Croquettes", es: "Croquetas de Cocido", ca: "Croquetes de Carn d'Olla" },
    description: { en: "A comforting blend of slow-cooked meats in a creamy béchamel with a deliciously crispy crust.", es: "Carnes de cocido cocinadas lentamente, mezcladas con una cremosa bechamel y un rebozado dorado.", ca: "Carns cuinades lentament, barrejades amb una cremosa beixamel i un arrebossat daurat i cruixent." }
  },
  {
    id: "d816f110-7788-4690-a96a-4c9f4740812f",
    name: { en: "Roast Chicken Croquettes", es: "Croquetas de Pollo Rustido", ca: "Croquetes de Pollastre Rostit" },
    description: { en: "Tender roasted chicken combined with a velvety béchamel and finished with a crisp golden coating.", es: "Tierno pollo rustido combinado con una cremosa bechamel y un crujiente acabado dorado.", ca: "Tendre pollastre rostit combinat amb una cremosa beixamel i un cruixent acabat daurat." }
  },
  {
    id: "c99a4ea0-8f02-4b32-84f5-be8f9c9d1294",
    name: { en: "Salt Cod Croquettes", es: "Croquetas de Bacalao", ca: "Croquetes de Bacallà" },
    description: { en: "Delicate salt cod mixed into a creamy béchamel, coated in a light and crunchy golden crust.", es: "Delicado bacalao incorporado a una suave bechamel y recubierto con un ligero rebozado crujiente.", ca: "Delicat bacallà incorporat a una suau beixamel i recobert amb un lleuger arrebossat cruixent." }
  },
  {
    id: "89ccd314-3b3d-428a-9ed3-845ef4762005",
    name: { en: "Spinach, Edam Cheese & Sun-Dried Tomato Croquettes", es: "Croquetas de Espinaca, Queso Edam y Tomate Seco", ca: "Croquetes d'Espinacs, Formatge Edam i Tomàquet Sec" },
    description: { en: "Fresh spinach, creamy Edam cheese and sun-dried tomatoes blended into a rich béchamel with a crispy finish.", es: "Espinacas frescas, queso Edam y tomate seco unidos en una cremosa bechamel con un crujiente rebozado.", ca: "Espinacs frescos, formatge Edam i tomàquet sec units en una cremosa beixamel amb un cruixent arrebossat." }
  },
  {
    id: "eef00da3-121f-427a-bbf8-34c0f54f0f37",
    name: { en: "Iberian Ham Croquettes", es: "Croquetas de Jamón Ibérico", ca: "Croquetes de Pernil Ibèric" },
    description: { en: "Premium Iberian ham folded into a silky béchamel and coated in a golden, crunchy breadcrumb.", es: "Exquisito jamón ibérico mezclado con una cremosa bechamel y un rebozado dorado y crujiente.", ca: "Exquisit pernil ibèric barrejat amb una cremosa beixamel i un arrebossat daurat i cruixent." }
  },
  {
    id: "ef86cbfd-8a90-46c2-87fd-25423e284a3c",
    name: { en: "Boletus Edulis Croquettes", es: "Croquetas de Boletus Edulis", ca: "Croquetes de Boletus Edulis" },
    description: { en: "Premium Boletus edulis mushrooms blended into a creamy béchamel for a rich, earthy flavour.", es: "Selectas setas Boletus edulis integradas en una cremosa bechamel con un intenso sabor a bosque.", ca: "Selectes bolets Boletus edulis integrats en una cremosa beixamel amb un intens sabor de bosc." }
  }
];

async function main() {
  for (const update of updates) {
    await prisma.product.update({
      where: { id: update.id },
      data: {
        name: update.name,
        description: update.description
      }
    });
    console.log(`Updated ${update.id} -> ${update.name.en}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
