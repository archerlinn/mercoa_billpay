import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const steps = ['Entity Info', 'Address', 'Details', 'Documents', 'Agreement'];

const MultiStepOnboarding = ({ onComplete, email }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    "createFromId": "org_test_3dd0f7c5-4d90-4d1f-8059-9a0eb7eeba2b",
    foreignId: `fake-id-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    legalBusinessName: '',
    doingBusinessAs: '',
    email: '',
    phone: '',
    website: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateOrProvince: '',
      postalCode: '',
      country: 'US',
    },
    ein: '',
    businessType: '',
    businessDescription: '',
    formationDate: '',
    merchantCategoryCode: '',
    maxTransactionSize: '',
    avgTransactionVolume: '',
    avgTransactionSize: '',
    logo: '',
    w9: '',
    form1099: '',
    bankStatement: '',
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [entityId, setEntityId] = useState(null);
  const [errors, setErrors] = useState({});

  const inputStyle = "border border-gray-300 rounded px-4 py-3 w-full h-14 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.legalBusinessName) newErrors.legalBusinessName = 'Business name is required';
      if (!formData.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) newErrors.email = 'Valid email is required';
      if (!/^[0-9]{10}$/.test(formData.phone)) {
        newErrors.phone = 'Phone must be exactly 10 digits (e.g. 4155551234)';
      }    }
    if (step === 1) {
      if (!formData.address.addressLine1) newErrors.addressLine1 = 'Address Line 1 is required';
      if (!formData.address.city) newErrors.city = 'City is required';
      if (!formData.address.stateOrProvince) newErrors.stateOrProvince = 'State is required';
      if (!formData.address.postalCode) newErrors.postalCode = 'Postal Code is required';
    }
    if (step === 2) {
      if (!formData.ein || !/^\d{2}-\d{7}$/.test(formData.ein)) newErrors.ein = 'EIN must be in format: 12-3456789';
      if (!formData.businessType) newErrors.businessType = 'Business type required';
      if (!formData.formationDate || !/^\d{4}-\d{2}-\d{2}$/.test(formData.formationDate)) newErrors.formationDate = 'Use YYYY-MM-DD format';
    }
    if (step === 3) {
      if (!formData.w9) newErrors.w9 = 'W9 is required';
      if (!formData.form1099) newErrors.form1099 = '1099 is required';
      if (!formData.bankStatement) newErrors.bankStatement = 'Bank Statement is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e, nested = false) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setErrors(prev => ({ ...prev, [name]: undefined }));
    if (nested) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: finalValue,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: finalValue,
      }));
    }
  };

  const handleFileChange = (e, fieldName, acceptedTypes) => {
    const file = e.target.files[0];
    if (file && !acceptedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Invalid file type' }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) return;
    setSubmitting(true);
  
    try {
      const userEmail = localStorage.getItem("logged_in_email");
  
      const res = await axios.post('http://localhost:8000/api/entity/create/', {
        ...formData,
        email: userEmail,
      });
  
      const { status, entity_id, entity_name, entity_logo } = res.data;
  
      // ✅ Proceed if entity was newly created or already existed
      if (status === "success" || status === "exists") {
        onComplete({
          entity_id: entity_id,
          legalBusinessName: entity_name || formData.legalBusinessName,
          logo: entity_logo || formData.logo,
        });
      } else {
        alert("Unexpected status from server.");
      }
  
    } catch (err) {
      console.error(err);
      alert("Something went wrong during onboarding!");
    }
  
    setSubmitting(false);
  };
  
  

  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
      />
    </div>
  );

  const renderField = (name, placeholder, nested = false) => (
    <div>
      <input
        name={name}
        placeholder={placeholder}
        value={nested ? formData.address[name] : formData[name]}
        onChange={(e) => handleChange(e, nested)}
        className={`${inputStyle} ${errors[name] ? 'border-red-500' : ''}`}
      />
      {errors[name] && <p className="text-red-500 text-xs">{errors[name]}</p>}
    </div>
  );

  const renderStep = () => {
    const fileStyle = "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100";
    const grid = "grid grid-cols-1 md:grid-cols-2 gap-6";
    switch (step) {
      case 0:
        return (
          <div className={grid}>
            {renderField('legalBusinessName', 'Business Name')}
            {renderField('doingBusinessAs', 'Doing Business As')}
            {renderField('email', 'Email')}
            {renderField('phone', 'Phone')}
            {renderField('website', 'Website')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo', ['image/png', 'image/jpeg'])}
                className={`${fileStyle} ${errors.logo ? 'border-red-500' : ''}`}
              />
              {errors.logo && <p className="text-red-500 text-xs">{errors.logo}</p>}
            </div>
          </div>
        );
      case 1:
        return (
          <div className={grid}>
            {renderField('addressLine1', 'Address Line 1', true)}
            {renderField('addressLine2', 'Address Line 2', true)}
            {renderField('city', 'City', true)}
            {renderField('stateOrProvince', 'State', true)}
            {renderField('postalCode', 'Postal Code', true)}
            {renderField('country', 'Country', true)}
          </div>
        );
      case 2:
        return (
          <div className={grid}>
            {renderField('ein', 'EIN (format: 12-3456789)')}
            {renderField('businessType', 'Business Type')}
            {renderField('merchantCategoryCode', 'Merchant Category Code')}
            {renderField('formationDate', 'Formation Date (YYYY-MM-DD)')}
            {renderField('maxTransactionSize', 'Max Transaction Size ($)')}
            {renderField('avgTransactionVolume', 'Avg Transaction Volume ($/mo)')}
            {renderField('avgTransactionSize', 'Avg Transaction Size ($)')}
            <textarea name="businessDescription" placeholder="Business Description" value={formData.businessDescription} onChange={handleChange} className={`${inputStyle} h-32 resize-none md:col-span-2`} />
          </div>
        );
      case 3:
        return (
          <div className={grid}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload W9 (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, 'w9', ['application/pdf'])}
                className={`${fileStyle} ${errors.w9 ? 'border-red-500' : ''}`}
              />
              {errors.w9 && <p className="text-red-500 text-xs">{errors.w9}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload 1099 (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, 'form1099', ['application/pdf'])}
                className={`${fileStyle} ${errors.form1099 ? 'border-red-500' : ''}`}
              />
              {errors.form1099 && <p className="text-red-500 text-xs">{errors.form1099}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bank Statement (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, 'bankStatement', ['application/pdf'])}
                className={`${fileStyle} ${errors.bankStatement ? 'border-red-500' : ''}`}
              />
              {errors.bankStatement && <p className="text-red-500 text-xs">{errors.bankStatement}</p>}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <label className="flex items-start space-x-2">
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1" />
              <span className="text-sm text-gray-600">
                I accept the <a href="#" className="text-indigo-600 underline">Platform Agreement</a> and <a href="#" className="text-indigo-600 underline">Privacy Policy</a>
              </span>
            </label>
            <motion.button
              onClick={handleSubmit}
              whileTap={{ scale: 0.95 }}
              disabled={submitting || !formData.termsAccepted}
              className={`w-full px-4 py-3 rounded text-white font-semibold transition ${
                submitting || !formData.termsAccepted ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {submitting ? 'Submitting...' : 'Create Business Entity'}
            </motion.button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl p-10 border border-white/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h2 className="text-3xl font-bold text-indigo-800 mb-2 text-center">Business Onboarding</h2>
      {renderProgressBar()}
      <div className="text-center mb-6 text-gray-600 text-sm tracking-wide uppercase">Step {step + 1} of {steps.length}: {steps[step]}</div>
      {renderStep()}
      <div className="flex justify-between mt-10">
        <button onClick={() => setStep(step - 1)} disabled={step === 0} className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 disabled:opacity-50 transition-all">Back</button>
        {step < steps.length - 1 && (
          <button
            onClick={() => {
              if (validateStep()) setStep(step + 1);
            }}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
          >
            Next
          </button>
        )}
      </div>
      {entityId && <div className="mt-6 text-center text-green-600 font-medium">✅ Entity created! ID: {entityId}</div>}
    </motion.div>
  );
};

export default MultiStepOnboarding;
