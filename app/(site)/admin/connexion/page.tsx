import { redirect } from "next/navigation";

// Ancienne adresse de connexion du back-office : la connexion est maintenant commune (/connexion).
export default function AdminLoginPage() {
  redirect("/connexion?suite=/admin");
}
