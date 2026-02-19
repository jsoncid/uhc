import { Icon } from '@iconify/react';

// --- Team Data ---
interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
}

interface Team {
  number: number;
  projectName: string;
  heroImage: string;
  description: string;
  members: TeamMember[];
}

const teamsData: Team[] = [
  {
    number: 1,
    projectName: 'Project Alpha',
    heroImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=500&fit=crop',
    description:
      'Project Alpha focuses on building next-generation AI-powered analytics dashboards that help businesses make data-driven decisions in real time. The team has developed innovative visualization techniques and predictive models that transform raw data into actionable insights.',
    members: [
      {
        name: 'Damián Fernando',
        role: 'UI / UX Designer',
        bio: 'Creative designer with 5+ years of experience crafting intuitive user interfaces and seamless digital experiences.',
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Isabella Fiore',
        role: 'Senior Project Manager',
        bio: 'Experienced project manager who excels at coordinating cross-functional teams and delivering projects on time.',
        image:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Yi Ming Sun',
        role: 'Senior Software Engineer',
        bio: 'Full-stack developer specializing in scalable cloud architectures and high-performance backend systems.',
        image:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
    ],
  },
  {
    number: 2,
    projectName: 'Project Beacon',
    heroImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=500&fit=crop',
    description:
      'Project Beacon is developing a comprehensive internal communication platform designed to improve team collaboration and streamline workflow management for distributed teams across multiple time zones.',
    members: [
      {
        name: 'Elena Vasquez',
        role: 'Lead Backend Developer',
        bio: 'Systems architect with deep expertise in microservices, event-driven design, and distributed databases.',
        image:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Marcus Chen',
        role: 'Frontend Developer',
        bio: 'React specialist passionate about building accessible, performant, and visually polished web applications.',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Aisha Patel',
        role: 'QA Engineer',
        bio: 'Quality advocate skilled in automated testing frameworks, CI/CD pipelines, and end-to-end test coverage.',
        image:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
    ],
  },
  {
    number: 3,
    projectName: 'Project Crest',
    heroImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=500&fit=crop',
    description:
      'Project Crest is an e-commerce optimization suite that leverages machine learning to personalize shopping experiences, optimize inventory management, and boost conversion rates for online retailers.',
    members: [
      {
        name: "Liam O'Brien",
        role: 'Machine Learning Engineer',
        bio: 'ML specialist focused on recommendation systems, NLP, and deploying production-grade AI models at scale.',
        image:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Sofia Nakamura',
        role: 'Product Designer',
        bio: 'Design thinker who bridges user research and visual design to create delightful product experiences.',
        image:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'James Adebayo',
        role: 'DevOps Engineer',
        bio: 'Infrastructure expert with hands-on experience in Kubernetes, Terraform, and cloud-native deployments.',
        image:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
    ],
  },
  {
    number: 4,
    projectName: 'Project Delta',
    heroImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=500&fit=crop',
    description:
      'Project Delta is building a secure, HIPAA-compliant telehealth platform that connects patients with healthcare professionals through video consultations, appointment scheduling, and digital health records.',
    members: [
      {
        name: 'Rachel Kim',
        role: 'Tech Lead',
        bio: 'Seasoned engineer leading technical strategy, mentoring developers, and driving engineering best practices.',
        image:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Carlos Rivera',
        role: 'Mobile Developer',
        bio: 'Cross-platform mobile developer building seamless Android and iOS applications with React Native and Flutter.',
        image:
          'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Emma Johansson',
        role: 'Data Analyst',
        bio: 'Analytics professional transforming complex datasets into clear, compelling stories that inform product decisions.',
        image:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
    ],
  },
  {
    number: 5,
    projectName: 'Project Echo',
    heroImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=500&fit=crop',
    description:
      'Project Echo is creating an open-source sustainability tracking tool that empowers organizations to monitor their environmental impact, set carbon reduction goals, and generate compliance reports.',
    members: [
      {
        name: 'Noah Williams',
        role: 'Full-Stack Developer',
        bio: 'Versatile developer comfortable across the entire stack, from database design to pixel-perfect frontends.',
        image:
          'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Priya Sharma',
        role: 'UI Developer',
        bio: 'Frontend craftsperson who turns design mockups into responsive, accessible, and beautiful web interfaces.',
        image:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
      {
        name: 'Oliver Tran',
        role: 'Security Engineer',
        bio: 'Cybersecurity specialist focused on threat modeling, penetration testing, and building secure-by-design systems.',
        image:
          'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face',
        linkedin: '#',
        instagram: '#',
        facebook: '#',
      },
    ],
  },
];

// --- Team Member Card Component ---
function TeamMemberCard({ member }: Readonly<{ member: TeamMember }>) {
  return (
    <div className="bg-white dark:bg-dark rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
      {/* Profile Image */}
      <div className="w-full aspect-square overflow-hidden">
        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
          {member.name}
        </h4>
        <p className="text-sm font-semibold text-primary mt-0.5 mb-3">{member.role}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          {member.bio}
        </p>

        {/* Social Icons */}
        <div className="flex items-center gap-3">
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 dark:text-gray-200 hover:text-[#2eb85c] dark:hover:text-[#2eb85c] transition-colors"
              aria-label={`${member.name} LinkedIn`}
            >
              <Icon icon="mdi:linkedin" width={22} height={22} />
            </a>
          )}
          {member.instagram && (
            <a
              href={member.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 dark:text-gray-200 hover:text-[#2eb85c] dark:hover:text-[#2eb85c] transition-colors"
              aria-label={`${member.name} Instagram`}
            >
              <Icon icon="mdi:instagram" width={22} height={22} />
            </a>
          )}
          {member.facebook && (
            <a
              href={member.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 dark:text-gray-200 hover:text-[#2eb85c] dark:hover:text-[#2eb85c] transition-colors"
              aria-label={`${member.name} Facebook`}
            >
              <Icon icon="mdi:facebook" width={22} height={22} />
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="text-gray-800 dark:text-gray-200 hover:text-[#2eb85c] dark:hover:text-[#2eb85c] transition-colors"
              aria-label={`Email ${member.name}`}
            >
              <Icon icon="mdi:email-outline" width={22} height={22} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Team Section Component ---
function TeamSection({ team }: Readonly<{ team: Team }>) {
  return (
    <section className="mb-16">
      {/* Team Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Team {team.number} <span className="text-primary">– {team.projectName}</span>
        </h2>
      </div>

      {/* Hero Image */}
      <div className="w-full h-56 md:h-72 lg:h-80 rounded-xl overflow-hidden mb-6">
        <img
          src={team.heroImage}
          alt={`${team.projectName} hero`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Project Description */}
      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-8 max-w-3xl">
        {team.description}
      </p>

      {/* Team Member Cards - "Meet Our Team Members" */}
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
        Meet Our Team Members
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.members.map((member) => (
          <TeamMemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}

// --- Main About Page ---
export default function About() {
  return (
    <div className="w-full">
      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
          About Our Teams
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Get to know the talented individuals behind our projects. Each team brings unique skills
          and perspectives to deliver exceptional results.
        </p>
      </div>

      {/* Team Sections */}
      {teamsData.map((team) => (
        <TeamSection key={team.number} team={team} />
      ))}
    </div>
  );
}
