import React, { useRef } from "react";
import PropTypes from "prop-types";

const Input = ({ ariaLabel, type, placeholder, icon, name, value, onChange, required }) => {
  const inputRef = useRef(null);

  const handleContainerClick = () => {
    inputRef.current.focus();
  };

  return (
    <div
      className="flex items-center rounded-md border bg-white p-2 shadow-md transition-all focus-within:border-blue-500 focus-within:shadow-lg hover:shadow-lg"
      onClick={handleContainerClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full flex-1 border-none bg-transparent text-black placeholder-gray-500 outline-none"
        name={name}
        value={value}
        required={required}
        onChange={onChange}
      />
    </div>
  );
};

Input.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

Input.defaultProps = {
  type: "text",
  placeholder: "",
  icon: null,
  required: false,
};

export default Input;
