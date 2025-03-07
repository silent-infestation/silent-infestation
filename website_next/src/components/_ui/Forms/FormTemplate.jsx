import React from 'react';
import Input from '../Input/InputForm';

const FormTemplate = ({ fields, onSubmit, submitButtonText = 'Submit', submitButton }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="grid w-full grid-cols-1 gap-6 rounded-lg">
      {fields.map(({ name, type, placeholder, label, required }) => (
        <div key={name} className="flex flex-col">
          {type === 'textarea' ? (
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

      {/* Bouton générique configurable */}
      {submitButton ? (
        submitButton
      ) : (
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
