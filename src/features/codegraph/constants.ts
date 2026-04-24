import { UserProfile } from './types';

export const DUMMY_USER: UserProfile = {
  name: "Rohan Satam",
  username: "rohansatam",
  email: "rohansatam@example.com",
  phone: "9876543210",
  location: {
    city: "Mumbai",
    pinCode: "400001",
    state: "Maharashtra",
    country: "India"
  },
  avatarUrl: "https://picsum.photos/seed/avatar1/128/128",
  profilePicture: "",
  bio: "Passionate software engineer with a strong foundation in data structures and algorithms. I love building scalable web applications and exploring new technologies. Currently focused on mastering full-stack development and contributing to open-source projects. When I'm not coding, you can find me reading about tech trends or participating in competitive programming contests.",
  skills: {
    languages: ["C++", "Java", "Python", "JavaScript", "TypeScript"],
    frameworks: ["React", "Node.js", "Express", "Tailwind CSS"],
    databases: ["MongoDB", "PostgreSQL", "Redis"],
    tools: ["Git", "Docker", "AWS", "Firebase"],
  },
  education: {
    collegeName: "University of Mumbai",
    branch: "Computer Science",
    graduationYear: "2024",
    degree: "B.E. in Computer Science",
    currentRole: "Software Engineer Intern @ TechCorp",
  },
  socialLinks: {
    github: "github.com/rohansatam",
    linkedin: "linkedin.com/in/rohansatam",
    twitter: "twitter.com/rohansatam",
    others: "",
    resume: "",
  },
  codingProfiles: {
    leetcode: "leetcode.com/rohansatam",
    hackerrank: "hackerrank.com/rohansatam",
    codeforces: "codeforces.com/rohansatam",
    geeksforgeeks: "geeksforgeeks.org/user/rohansatam",
    others: "",
  },
  workExperience: [
    {
      id: "1",
      company: "TechCorp",
      mode: "Remote",
      role: "Software Engineer Intern",
      startDate: "2024-01-01",
      isOngoing: true,
      description: "• Developing and maintaining web applications using React and Node.js.\n• Collaborating with the design team to implement responsive UI components.\n• Participating in code reviews and agile sprint planning sessions."
    },
    {
      id: "2",
      company: "InnovateSoft",
      mode: "On-site",
      role: "Junior Web Developer",
      startDate: "2023-06-01",
      endDate: "2023-12-31",
      isOngoing: false,
      description: "• Assisted in the development of client-facing websites using HTML, CSS, and JavaScript.\n• Optimized website performance, resulting in a 20% increase in speed.\n• Worked closely with senior developers to troubleshoot and resolve bugs."
    }
  ],
  projects: [
    {
      id: "1",
      title: "E-Commerce Platform",
      role: "Full Stack Developer",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      isOngoing: false,
      highlights: "• Built a full-stack e-commerce application using React, Node.js, and MongoDB.\n• Implemented secure user authentication with JWT and integrated Stripe for payments.\n• Optimized database queries, reducing page load time by 30%."
    },
    {
      id: "2",
      title: "Task Management App",
      role: "Frontend Developer",
      startDate: "2023-11-01",
      endDate: "2023-12-31",
      isOngoing: false,
      highlights: "• Developed a responsive task management dashboard using React and Tailwind CSS.\n• Integrated drag-and-drop functionality for task status updates using React Beautiful DND.\n• Implemented real-time updates using WebSockets for collaborative task tracking."
    }
  ],
  streak: 328,
};
