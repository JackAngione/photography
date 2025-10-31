import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex flex-col items-end px-8">
      <Link className="hover:text-accent " href="/">
        HOME
      </Link>
      {/*TODO: make this a little dropdown with socails/email*/}
      <Link className="hover:text-accent " href="/gallery">
        GALLERY
      </Link>
      <Link className="" href="/contact">
        CONTACT
      </Link>
      <Link className="" href="/booking">
        BOOKING
      </Link>
    </nav>
  );
}
