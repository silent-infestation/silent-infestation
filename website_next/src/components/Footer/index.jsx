import Link from "next/link";
import { FaLinkedin, FaTwitter, FaInstagram, FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="flex flex-col items-center bg-[#00202b] py-6 text-[#f8f2e2]">
      {/* Réseaux sociaux */}
      <div className="mb-4 flex gap-6">
        <Link href="https://www.linkedin.com" target="_blank" className="hover:text-gray-400">
          <FaLinkedin size={24} />
        </Link>
        <Link href="https://twitter.com" target="_blank" className="hover:text-gray-400">
          <FaTwitter size={24} />
        </Link>
        <Link href="https://www.instagram.com" target="_blank" className="hover:text-gray-400">
          <FaInstagram size={24} />
        </Link>
        <Link href="https://github.com" target="_blank" className="hover:text-gray-400">
          <FaGithub size={24} />
        </Link>
      </div>

      {/* Copyright */}
      <p className="text-sm font-light">© {new Date().getFullYear()} Tous droits réservés.</p>
    </footer>
  );
};

export default Footer;
