import React from "react";
import Input from "../Input/InputForm";

const FormTemplate = ({ fields, onSubmit, submitButtonText = "Envoyer le message", submitButton }) => {
  // Gère la soumission du formulaire
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget); // Crée un objet FormData avec les entrées du formulaire
    const data = Object.fromEntries(formData.entries()); // Convertit FormData en un objet JavaScript
    onSubmit(data); // Appelle la fonction de soumission avec les données du formulaire
  };

  return (
    <form onSubmit={handleSubmit} className="grid w-full grid-cols-1 gap-6 rounded-lg">
      {/* Rendu des champs du formulaire */}
      {fields.map(({ name, type, placeholder, label, required }) => (
        <div key={name} className="flex flex-col">
          {type === "textarea" ? (
            <textarea
              name={name}
              aria-label={label}
              placeholder={placeholder}
              required={required}
              className="shadow-custom flex h-48 items-center rounded border border-default bg-element p-2 placeholder-gray-500 shadow-default outline-none transition-all duration-200 focus-within:border-focusWithin focus-within:shadow-hover hover:shadow-hover"
            />
          ) : (
            <Input
              name={name}
              type={type}
              ariaLabel={label}
              placeholder={placeholder}
              required={required}
            />
          )}
        </div>
      ))}

      {/* Rendu du bouton de soumission */}
      {submitButton ? (
        // Si un bouton personnalisé est passé, on l'affiche
        submitButton
      ) : (
        // Si pas de bouton personnalisé, on affiche un bouton générique
        <button
          type="submit"
          className="focus-within:border-focus text- flex items-center justify-center rounded border border-default bg-element p-2 text-gray-700 shadow-default outline-none transition-all duration-200 focus-within:shadow-hover hover:shadow-hover active:shadow-active"
        >
          {submitButtonText}
        </button>
      )}
    </form>
  );
};

export default FormTemplate;
