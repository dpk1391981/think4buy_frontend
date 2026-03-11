import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PostPropertyForm {
  // Step 1
  userType: 'owner' | 'agent' | '';
  // Step 2
  mainCategory: string; // residential, commercial, industrial, pg, builder_project, investment
  // Step 3
  listingType: 'rent' | 'buy' | ''; // rent or sale
  // Step 4 - Location
  state: string;
  stateId: string;
  city: string;
  cityId: string;
  locality: string;
  pincode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  // Step 5 - Auto title (read-only, generated)
  autoTitle: string;
  // Step 6 - Property Type & Details
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  areaUnit: string;
  floor: string;
  totalFloors: string;
  furnishingStatus: string;
  possessionStatus: string;
  // Industrial extra
  industrialHeight: string;
  industrialPowerLoad: string;
  hasDock: boolean;
  hasRamp: boolean;
  // Step 7 - Description
  description: string;
  // Agent info
  agencyName: string;
  // Step 8 - Price
  price: string;
  priceUnit: string;
  brokerage: string;
  brokerageCustom: string;
  // Step 9 - Media (file names only for Redux, actual File objects kept in component)
  mediaCount: number;
}

const initialFormState: PostPropertyForm = {
  userType: '',
  mainCategory: '',
  listingType: '',
  state: 'Delhi',
  stateId: '',
  city: 'Delhi',
  cityId: '',
  locality: '',
  pincode: '',
  address: '',
  latitude: null,
  longitude: null,
  autoTitle: '',
  propertyType: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  areaUnit: 'sqft',
  floor: '',
  totalFloors: '',
  furnishingStatus: 'unfurnished',
  possessionStatus: 'ready_to_move',
  industrialHeight: '',
  industrialPowerLoad: '',
  hasDock: false,
  hasRamp: false,
  agencyName: '',
  description: '',
  price: '',
  priceUnit: 'total',
  brokerage: '',
  brokerageCustom: '',
  mediaCount: 0,
};

interface PostPropertyState {
  currentStep: number;
  totalSteps: number;
  form: PostPropertyForm;
  isSubmitting: boolean;
  submitError: string;
  submittedPropertySlug: string;
}

const initialState: PostPropertyState = {
  currentStep: 0,
  totalSteps: 10,
  form: initialFormState,
  isSubmitting: false,
  submitError: '',
  submittedPropertySlug: '',
};

export const postPropertySlice = createSlice({
  name: 'postProperty',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    nextStep: (state) => {
      if (state.currentStep < state.totalSteps - 1) state.currentStep++;
    },
    prevStep: (state) => {
      if (state.currentStep > 0) state.currentStep--;
    },
    updateForm: (state, action: PayloadAction<Partial<PostPropertyForm>>) => {
      Object.assign(state.form, action.payload);
    },
    resetForm: () => initialState,
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setSubmitError: (state, action: PayloadAction<string>) => {
      state.submitError = action.payload;
    },
    setSubmittedSlug: (state, action: PayloadAction<string>) => {
      state.submittedPropertySlug = action.payload;
    },
  },
});

export const {
  setStep,
  nextStep,
  prevStep,
  updateForm,
  resetForm,
  setSubmitting,
  setSubmitError,
  setSubmittedSlug,
} = postPropertySlice.actions;
export default postPropertySlice.reducer;
