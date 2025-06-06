import React, { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

// Helper to sort age groups
const sortAgeGroups = (groups: string[]) => {
  const order = ['18-24', '25-34', '35-44', '45-54', '55+'];
  return [...groups].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
};

const FilterPanel: React.FC = () => {
  const { filters, selectedFilters, setSelectedFilters, applyFilters, resetFilters } = useData();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Use plural keys everywhere for consistency
  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleFilterChange = (filterType: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => {
      const currentFilters = [...prev[filterType]];
      if (currentFilters.includes(value)) {
        return {
          ...prev,
          [filterType]: currentFilters.filter(item => item !== value)
        };
      } else {
        return {
          ...prev,
          [filterType]: [...currentFilters, value]
        };
      }
    });
  };

  const getFilterCount = (filterType: keyof typeof selectedFilters): number => {
    return selectedFilters[filterType].length;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Age Group Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('ageGroups')}
            className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm rounded-md border ${
              openDropdown === 'ageGroups' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
            } ${getFilterCount('ageGroups') > 0 ? 'bg-blue-50' : 'bg-white'}`}
          >
            <span>
              Age Group
              {getFilterCount('ageGroups') > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getFilterCount('ageGroups')}
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'ageGroups' ? 'transform rotate-180' : ''}`} />
          </button>
          
          {openDropdown === 'ageGroups' && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
              <div className="py-1">
                {sortAgeGroups(filters.ageGroups).map(ageGroup => (
                  <div
                    key={ageGroup}
                    onClick={() => handleFilterChange('ageGroups', ageGroup)}
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedFilters.ageGroups.includes(ageGroup) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedFilters.ageGroups.includes(ageGroup) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="ml-2">{ageGroup}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Gender Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('genders')}
            className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm rounded-md border ${
              openDropdown === 'genders' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
            } ${getFilterCount('genders') > 0 ? 'bg-blue-50' : 'bg-white'}`}
          >
            <span>
              Gender
              {getFilterCount('genders') > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getFilterCount('genders')}
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'genders' ? 'transform rotate-180' : ''}`} />
          </button>
          
          {openDropdown === 'genders' && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
              <div className="py-1">
                {filters.genders.map(gender => (
                  <div
                    key={gender}
                    onClick={() => handleFilterChange('genders', gender)}
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedFilters.genders.includes(gender) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedFilters.genders.includes(gender) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="ml-2">{gender}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Family Composition Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('familyCompositions')}
            className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm rounded-md border ${
              openDropdown === 'familyCompositions' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
            } ${getFilterCount('familyCompositions') > 0 ? 'bg-blue-50' : 'bg-white'}`}
          >
            <span>
              Family Composition
              {getFilterCount('familyCompositions') > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getFilterCount('familyCompositions')}
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'familyCompositions' ? 'transform rotate-180' : ''}`} />
          </button>
          
          {openDropdown === 'familyCompositions' && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
              <div className="py-1">
                {filters.familyCompositions.map(composition => (
                  <div
                    key={composition}
                    onClick={() => handleFilterChange('familyCompositions', composition)}
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedFilters.familyCompositions.includes(composition) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedFilters.familyCompositions.includes(composition) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="ml-2">{composition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Applied Filters */}
      <div className="flex flex-wrap gap-2 mt-4">
        {Object.entries(selectedFilters).map(([filterType, values]) => 
          (values as string[]).map(value => (
            <div 
              key={`${filterType}-${value}`}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              <span className="mr-1">{value}</span>
              <button 
                onClick={() => handleFilterChange(filterType as keyof typeof selectedFilters, value)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
        
        {Object.values(selectedFilters).some(filters => filters.length > 0) && (
          <button 
            onClick={resetFilters}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="flex justify-end mt-4 space-x-2">
        <button 
          onClick={resetFilters}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button 
          onClick={applyFilters}
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;