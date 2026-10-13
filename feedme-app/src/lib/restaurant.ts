export type Restaurant = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  price: number;
  badge: string;
  badgeAccent?: boolean;
  walkTime: string;
  image: string;
};

export const restaurants: Restaurant[] = [
  {
    id: "cantine-emile",
    name: "La Cantine d’Émile",
    description: "Sandwich baguette grillé & boisson fraîche",
    priceLabel: "Formule midi",
    price: 5.2,
    badge: "Prix mini ",
    walkTime: "3 min • Bât. B",
    image: "/images/cantine-emile.jpg",
  },
  {
    id: "bao-et-bol",
    name: "Bao & Bol",
    description: "Nouilles sautées tofu ou poulet croustillant",
    priceLabel: "Plat signature",
    price: 6.8,
    badge: "Top portion ",
    badgeAccent: true,
    walkTime: "5 min • Esplanade",
    image: "/images/bao-et-bol.jpg",
  },
  {
    id: "fournil-des-arts",
    name: "Le Fournil des Arts",
    description: "Formule quiche dorée + cookie chaud",
    priceLabel: "Menu express",
    price: 4.9,
    badge: "Moins de 5 € ",
    walkTime: "2 min • Sortie Métro",
    image: "/images/fournil-des-arts.jpg",
  },
];

export const formatPrice = (value: number) =>
  `${value.toFixed(2).replace(".", ",")} €`;