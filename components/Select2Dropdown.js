import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'select2';

const Select2Dropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select Product...",
  width = "100%",
  dropdownWidth = "500px",
  ...props 
}) => {
  const selectRef = useRef(null);

  useEffect(() => {
    if (selectRef.current) {
      // Initialize Select2
      $(selectRef.current).select2({
        placeholder: placeholder,
        dropdownAutoWidth: false,
        width: width,
        dropdownCss: {
          width: dropdownWidth,
          minWidth: '400px'
        }
      });

      // Handle change event
      $(selectRef.current).on('select2:select', (e) => {
        onChange(e.target.value);
        $(selectRef.current).select2('close');
      });

      // Handle change event for clear
      $(selectRef.current).on('select2:unselect', (e) => {
        onChange('');
      });
    }

    // Cleanup
    return () => {
      if (selectRef.current) {
        $(selectRef.current).off('select2:select');
        $(selectRef.current).select2('destroy');
      }
    };
  }, [onChange, placeholder, width, dropdownWidth]);

  useEffect(() => {
    if (selectRef.current) {
      $(selectRef.current).val(value).trigger('change');
    }
  }, [value]);

  return (
    <select 
      ref={selectRef} 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%' }}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select2Dropdown;
