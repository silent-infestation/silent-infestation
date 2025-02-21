import Link from "next/link";
import { FaLinkedin, FaTwitter, FaInstagram, FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#00202b] text-[#f8f2e2] flex flex-col items-center py-6">
      {/* Réseaux sociaux */}
      <div className="flex gap-6 mb-4">
        <Link
          href="https://www.linkedin.com"
          target="_blank"
          className="hover:text-gray-400"
        >
          <FaLinkedin size={24} />
        </Link>
        <Link
          href="https://twitter.com"
          target="_blank"
          className="hover:text-gray-400"
        >
          <FaTwitter size={24} />
        </Link>
        <Link
          href="https://www.instagram.com"
          target="_blank"
          className="hover:text-gray-400"
        >
          <FaInstagram size={24} />
        </Link>
        <Link
          href="https://github.com"
          target="_blank"
          className="hover:text-gray-400"
        >
          <FaGithub size={24} />
        </Link>
      </div>

      {/* Copyright */}
      <p className="text-sm font-light">
        © {new Date().getFullYear()} Tous droits réservés.
      </p>
    </footer>
  );
};

export default Footer;
