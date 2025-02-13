import React, { useRef } from "react";
import PropTypes from "prop-types";
import styles from "./Input.module.css";

const Input = ({ ariaLabel, type, placeholder, icon, name, value, onChange, required }) => {
  // Créer une référence pour l'élément input
  const inputRef = useRef(null);

  // Fonction pour gérer le clic sur la div et mettre le focus sur l'input
  const handleContainerClick = () => {
    inputRef.current.focus();
  };

  return (
    <div className={styles.inputContainer} onClick={handleContainerClick}>
      {icon && <span>{icon}</span>}

      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={styles.input}
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
  height: PropTypes.string,
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
