import { Grid2X2Plus } from "lucide-react";
import {
  FiFacebook,
  FiGithub,
  FiInstagram,
  FiLinkedin,
  FiYoutube,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";

export function MinimalFooter() {
  const year = new Date().getFullYear();

  const company = [
    {
      title: "About Us",
      href: "#",
    },
    {
      title: "Careers",
      href: "#",
    },
    {
      title: "Brand assets",
      href: "#",
    },
    {
      title: "Privacy Policy",
      href: "#",
    },
    {
      title: "Terms of Service",
      href: "#",
    },
  ];

  const resources = [
    {
      title: "Blog",
      href: "#",
    },
    {
      title: "Help Center",
      href: "#",
    },
    {
      title: "Contact Support",
      href: "#",
    },
    {
      title: "Community",
      href: "#",
    },
    {
      title: "Security",
      href: "#",
    },
  ];

  const socialLinks = [
    {
      icon: <FiFacebook className="size-4" />,
      link: "#",
    },
    {
      icon: <FiGithub className="size-4" />,
      link: "#",
    },
    {
      icon: <FiInstagram className="size-4" />,
      link: "#",
    },
    {
      icon: <FiLinkedin className="size-4" />,
      link: "#",
    },
    {
      icon: <FaXTwitter className="size-4" />,
      link: "#",
    },
    {
      icon: <FiYoutube className="size-4" />,
      link: "#",
    },
  ];
  return (
    <footer className="relative">
      <div className="bg-[radial-gradient(35%_80%_at_30%_0%,--theme(--color-white/.1),transparent)] mx-auto max-w-4xl md:border-x md:border-border/20">
        <div className="bg-border/20 absolute inset-x-0 h-px w-full " />
        <div className="grid max-w-4xl grid-cols-6 gap-6 p-4">
          <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
            <a href="#" className="w-max opacity-25">
              <Grid2X2Plus className="size-8 text-white" />
            </a>
            <p className="text-muted-foreground max-w-sm font-mono text-sm text-balance">
              A smart incident response platform.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((item, i) => (
                <a
                  key={i}
                  className="hover:bg-accent/15 rounded-md border p-1.5 text-white"
                  target="_blank"
                  href={item.link}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-muted-foreground mb-1 text-xs font-[geist-medium]">
              Resources
            </span>
            <div className="flex flex-col gap-1">
              {resources.map(({ href, title }, i) => (
                <a
                  key={i}
                  className={`w-max py-1 text-sm duration-200 hover:underline text-white font-[geist-regular]`}
                  href={href}
                >
                  {title}
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-muted-foreground mb-1 text-xs font-[geist-medium]">Company</span>
            <div className="flex flex-col gap-1">
              {company.map(({ href, title }, i) => (
                <a
                  key={i}
                  className={`w-max py-1 text-sm duration-200 hover:underline text-white font-[geist-regular]`}
                  href={href}
                >
                  {title}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-border/20 absolute inset-x-0 h-px w-full" />
        <div className="flex max-w-4xl flex-col justify-between gap-2 pt-2 pb-5">
          <p className="text-muted-foreground text-center font-thin">
            © <a href="https://x.com/sshahaider">CodeBlooded</a>. All rights
            reserved {year}
          </p>
        </div>
      </div>
    </footer>
  );
}
