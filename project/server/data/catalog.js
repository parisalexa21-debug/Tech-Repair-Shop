/** In-memory catalog; swap for a database when you connect internal systems. */

export const products = [
  {
    id: "phone",
    name: "Phones",
    summary: "Smartphones from major brands, accessories, and trade-ready devices.",
    priceFrom: 199,
    highlights: ["New & refurbished", "Warranty available", "Carrier unlock help"],
  },
  {
    id: "laptop",
    name: "Laptops",
    summary: "Business and consumer laptops tuned for work, school, and creative tasks.",
    priceFrom: 449,
    highlights: ["SSD upgrades", "RAM expansion", "OS setup"],
  },
  {
    id: "tablet",
    name: "Tablets",
    summary: "Compact screens for reading, drawing, and on-the-go productivity.",
    priceFrom: 129,
    highlights: ["Stylus-ready models", "Kid-friendly options", "Keyboard bundles"],
  },
];

export const services = [
  {
    id: "repair",
    name: "Repairs",
    summary: "Screen, battery, charging port, and board-level work by certified technicians.",
    priceFrom: 49,
    highlights: ["Diagnostics first", "Parts in stock", "Same-day when possible"],
  },
  {
    id: "tech-support",
    name: "Tech support",
    summary: "Setup, backups, malware cleanup, and troubleshooting in shop or remote.",
    priceFrom: 39,
    highlights: ["Data safety first", "Clear explanations", "Follow-up tips"],
  },
  {
    id: "delivery",
    name: "Delivery",
    summary: "Local drop-off and pickup for devices and orders within our service area.",
    priceFrom: 15,
    highlights: ["Scheduled windows", "Insured handling", "Status updates"],
  },
];
