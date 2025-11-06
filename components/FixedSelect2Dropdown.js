import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'select2';

const FixedSelect2Dropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select Product..."
}) => {
  const selectRef = useRef(null);

  useEffect(() => {
    if (selectRef.current) {
      // Initialize with fixed container
      $(selectRef.current).select2({
        placeholder: placeholder,
        width: '180px', // Fixed width
        dropdownAutoWidth: false,
        dropdownCss: {
          'width': '500px'
        }
      });

      $(selectRef.current).on('select2:select', (e) => {
        onChange(e.target.value);
        $(selectRef.current).select2('close');
      });

      $(selectRef.current).on('select2:unselect', (e) => {
        onChange('');
      });
    }

    return () => {
      if (selectRef.current) {
        $(selectRef.current).off('select2:select');
        $(selectRef.current).select2('destroy');
      }
    };
  }, [onChange, placeholder]);

  useEffect(() => {
    if (selectRef.current) {
      $(selectRef.current).val(value).trigger('change');
    }
  }, [value]);

  return (
    <div style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }}>
      <select 
        ref={selectRef} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FixedSelect2Dropdown;
