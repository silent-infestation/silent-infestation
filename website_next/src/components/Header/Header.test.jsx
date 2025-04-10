import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header"; // Assurez-vous que l'importation est correcte

describe("Header component", () => {
  it("devrait afficher le bouton avec le texte correct", () => {
    render(<Header />);

    // Vérifier si le bouton "Scanner un site" est dans le document
    const button = screen.getByText("Scanner un site");
    expect(button).toBeInTheDocument();

    // Vérifier que le bouton est cliquable (simuler un clic)
    fireEvent.click(button);

    // Vous pouvez ajouter un test ici pour vérifier que quelque chose se passe après le clic
    // Par exemple, vérifier si une certaine fonction a été appelée ou si le bouton change d'état
  });
});
