import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex flex-col items-end pr-8">
      <Link className="hover:text-accent " href="/">
        HOME
      </Link>

      {/*TODO: make this a little dropdown with socails/email*/}

      <Link className="" href="/booking">
        BOOKING
      </Link>
    </nav>
  );
}
