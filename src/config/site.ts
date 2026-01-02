export const siteConfig = {
  name: "Autoland Monitoring",
  title: "Autoland Monitoring - Vietjet AMO",
  description: "Hệ thống giám sát Autoland CAT 3 của đội tàu bay VietJet",
  keywords: ["autoland", "vietjet", "monitoring", "aircraft", "cat3", "aviation"],
  authors: [{ name: "Vietjet AMO ICT Department", url: "https://www.amoict.com" }],
  creator: "Vietjet AMO IT Department",
  publisher: "Vietjet Aviation Joint Stock Company",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "Autoland Monitoring - Vietjet AMO",
    description: "Hệ thống giám sát Autoland CAT 3 của đội tàu bay VietJet",
    siteName: "Autoland Monitoring",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autoland Monitoring - Vietjet AMO ICT",
    description: "Hệ thống giám sát Autoland của đội tàu bay VietJet",
    creator: "@vietjetair",
  },
  links: {
    main: "/",
    dashboard: "/dashboard",
    aircraft: "/aircraft",
    reports: "/reports",
    fleet: "/fleet",
    docs: "/docs",
  },
} as const

