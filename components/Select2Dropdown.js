'use client';

import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'select2';

const Select2Dropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select Product...",
  width = "100%",
  dropdownWidth = "600px", // Increased width
  dropdownHeight = "400px", // Added height control
  ...props 
}) => {
  const selectRef = useRef(null);

  useEffect(() => {
    if (selectRef.current) {
      // Initialize Select2 with custom dimensions
      $(selectRef.current).select2({
        placeholder: placeholder,
        width: width,
        dropdownAutoWidth: false,
        dropdownCss: {
          'width': dropdownWidth,
          'min-width': dropdownWidth,
          'max-width': dropdownWidth,
          'max-height': dropdownHeight, // Control height
          'min-height': '300px' // Minimum height
        },
        containerCss: {
          'width': '100%',
          'min-width': '200px'
        }
      });

      // Handle selection
      $(selectRef.current).on('select2:select', (e) => {
        onChange(e.target.value);
        $(selectRef.current).select2('close');
      });

      $(selectRef.current).on('select2:unselect', (e) => {
        onChange('');
      });

      // Customize dropdown on open
      $(selectRef.current).on('select2:open', () => {
        setTimeout(() => {
          const $dropdown = $('.select2-dropdown');
          if ($dropdown.length) {
            $dropdown.css({
              'width': dropdownWidth,
              'min-width': dropdownWidth,
              'max-width': dropdownWidth,
              'max-height': dropdownHeight,
              'min-height': '300px'
            });
            
            // Also customize the results container
            const $results = $dropdown.find('.select2-results__options');
            if ($results.length) {
              $results.css({
                'max-height': '350px', // Slightly less than dropdown height
                'min-height': '250px'
              });
            }
          }
        }, 10);
      });
    }

    return () => {
      if (selectRef.current) {
        $(selectRef.current).off('select2:select');
        $(selectRef.current).select2('destroy');
      }
    };
  }, [onChange, placeholder, width, dropdownWidth, dropdownHeight]);

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
