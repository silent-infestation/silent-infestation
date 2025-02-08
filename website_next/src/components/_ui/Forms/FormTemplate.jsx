import React from "react";
import Input from "../Input/InputForm";

const FormTemplate = ({
  fields,
  onSubmit,
  submitButtonText = "Submit",
  submitButton,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-lg grid grid-cols-1 gap-6 w-full"
    >
      {fields.map(({ name, type, placeholder, label, required }) => (
        <div key={name} className="flex flex-col">
          {type === "textarea" ? (
            <textarea
              name={name}
              aria-label={label}
              placeholder={placeholder}
              required={required}
              className="border p-2 rounded h-48 placeholder-gray-500 bg-[var(--background-element)] text-gray-500 border-gray-300 shadow-md transition-all duration-200 hover:shadow-lg focus-within:shadow-lg focus-within:border-gray-500"
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

      {/* Bouton générique configurable */}
      {submitButton ? (
        submitButton
      ) : (
        <button
          type="submit"
          className="flex items-center p-2 border text-gray-500 border-gray-300 rounded shadow-md bg-[var(--background-element)] transition-all duration-200 hover:shadow-lg focus-within:shadow-lg focus-within:border-gray-500"
        >
          {submitButtonText}
        </button>
      )}
    </form>
  );
};

export default FormTemplate;
