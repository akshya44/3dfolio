import {
  mobile,
  backend,
  creator,
  web,
  javascript,
  typescript,
  html,
  css,
  reactjs,
  redux,
  tailwind,
  nodejs,
  mongodb,
  git,
  figma,
  docker,
  meta,
  starbucks,
  tesla,
  shopify,
  carrent,
  jobit,
  tripguide,
  threejs,
  mycurrentphoto,
  aws,
  oracle,
  eycyber,
} from "../assets";

export const navLinks = [
  {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Projects",
  },
  {
    id: "certificates",
    title: "Certificates",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const services = [
  {
    title: "Cyber Security",
    icon: backend,
  },
  {
    title: "Software Developer",
    icon: web,
  },
  {
    title: "React Developer",
    icon: mobile,
  },
  {
    title: "Problem Solver",
    icon: creator,
  },
];

const technologies = [
  {
    name: "HTML 5",
    icon: html,
  },
  {
    name: "CSS 3",
    icon: css,
  },
  {
    name: "JavaScript",
    icon: javascript,
  },
  {
    name: "TypeScript",
    icon: typescript,
  },
  {
    name: "React JS",
    icon: reactjs,
  },
  {
    name: "Redux Toolkit",
    icon: redux,
  },
  {
    name: "Tailwind CSS",
    icon: tailwind,
  },
  {
    name: "Node JS",
    icon: nodejs,
  },
  {
    name: "MongoDB",
    icon: mongodb,
  },
  {
    name: "Three JS",
    icon: threejs,
  },
  {
    name: "git",
    icon: git,
  },
  {
    name: "figma",
    icon: figma,
  },
  {
    name: "docker",
    icon: docker,
  },
];

const certificates = [
  {
    name: "AWS Cloud Foundation",
    description: "Foundation knowledge of AWS cloud services and architecture.",
    image: aws,
    link: "public/resume.pdf" // Using resume as placeholder or actual cert link if available
  },
  {
    name: "Oracle AI Vector Search",
    description: "Knowledge of AI-based vector similarity search techniques.",
    image: oracle,
    link: "public/resume.pdf"
  },
  {
    name: "EY Cyber Security",
    description: "Practical cybersecurity and secure system practices.",
    image: eycyber,
    link: "public/resume.pdf"
  },
];

const experiences = [];
const testimonials = [];

const projects = [
  {
    name: "HealthInsuranceDapp",
    description:
      "A blockchain-based decentralized health insurance application ensuring secure and transparent insurance claim processing using smart contracts.",
    tags: [
      {
        name: "blockchain",
        color: "blue-text-gradient",
      },
      {
        name: "solidity",
        color: "green-text-gradient",
      },
      {
        name: "react",
        color: "pink-text-gradient",
      },
    ],
    image: backend, // Placeholder using generic icon
    source_code_link: "https://github.com/akshya44/Blockchain-Health-Insurance-DApp",
  },
  {
    name: "Crypt-Exchange",
    description:
      "Cryptocurrency exchange simulation platform allowing users to monitor market trends and simulate trading operations.",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "api",
        color: "green-text-gradient",
      },
      {
        name: "chartjs",
        color: "pink-text-gradient",
      },
    ],
    image: web, // Placeholder using generic icon
    source_code_link: "https://github.com/akshya44/Crypt-Exchange",
  },
  {
    name: "BashMaintenanceSuite",
    description:
      "Linux automation toolkit using Bash scripts to perform maintenance, backup, and cleanup tasks efficiently.",
    tags: [
      {
        name: "bash",
        color: "blue-text-gradient",
      },
      {
        name: "linux",
        color: "green-text-gradient",
      },
      {
        name: "automation",
        color: "pink-text-gradient",
      },
    ],
    image: creator, // Placeholder using generic icon
    source_code_link: "https://github.com/akshya44/Linux-System-Maintenance-Suite",
  },
];

export { services, technologies, experiences, testimonials, projects, certificates };
