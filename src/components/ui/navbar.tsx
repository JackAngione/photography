import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex flex-col items-end pr-8">
      <Link className="hover:text-accent " href="/">
        HOME
      </Link>
      <Link className="hover:text-accent" href="/pricing">
        PRICING
      </Link>
      <Link className="hover:text-accent" href="/booking">
        BOOKING
      </Link>
    </nav>
  );
}
