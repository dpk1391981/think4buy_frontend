import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Config types (from property-config API) ──────────────────────────────────
export interface PropConfigCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface PropConfigType {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface PropConfigAmenity {
  id: string;
  name: string;
  icon?: string;
  category?: string;
}

export interface PropConfigField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'radio' | 'textarea' | 'dependent';
  optionsJson: string[] | string | null;
  placeholder: string | null;
  isRequired: boolean;
  sortOrder: number;
}

// ─── Form shape ───────────────────────────────────────────────────────────────
export interface PostPropertyForm {
  // Step 0
  userType: 'owner' | 'agent' | '';
  agencyName: string;
  // Step 1 — Category (dynamic from config)
  mainCategory: string;  // slug: buy, rent, pg, commercial, industrial, builder_project, investment
  categoryId: string;    // UUID from prop_categories
  // Step 2 — Listing type (shown only for commercial/industrial/builder_project/investment)
  listingType: 'rent' | 'buy' | '';
  // Step 3 — Property type (dynamic from config, filtered by categoryId)
  propertyType: string;  // slug
  typeId: string;        // UUID from prop_types
  // Step 4 — Location
  state: string;
  stateId: string;
  city: string;
  cityId: string;
  locality: string;
  localityId: string;
  pincode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  // Step 5 — Auto title
  autoTitle: string;
  // Step 6 — Details (standard)
  bedrooms: string;
  bathrooms: string;
  area: string;
  areaUnit: string;
  floor: string;
  totalFloors: string;
  furnishingStatus: string;
  possessionStatus: string;
  industrialHeight: string;
  industrialPowerLoad: string;
  hasDock: boolean;
  hasRamp: boolean;
  // Step 6 cont — Dynamic fields from config
  dynamicFields: Record<string, string>;
  // Step 7 — Amenities (dynamic from config)
  amenityIds: string[];
  // Step 8 — Description
  description: string;
  // Step 9 — Price
  price: string;
  priceUnit: string;
  brokerage: string;
  brokerageCustom: string;
  // Step 10 — Media
  mediaCount: number;
  // Brochure (builder_project only)
  existingBrochureUrl: string;
}

const initialFormState: PostPropertyForm = {
  userType: '',
  agencyName: '',
  mainCategory: '',
  categoryId: '',
  listingType: '',
  propertyType: '',
  typeId: '',
  state: 'Delhi',
  stateId: '',
  city: 'Delhi',
  cityId: '',
  locality: '',
  localityId: '',
  pincode: '',
  address: '',
  latitude: null,
  longitude: null,
  autoTitle: '',
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
  dynamicFields: {},
  amenityIds: [],
  description: '',
  price: '',
  priceUnit: 'total',
  brokerage: '',
  brokerageCustom: '',
  mediaCount: 0,
  existingBrochureUrl: '',
};

interface PostPropertyState {
  currentStep: number;
  totalSteps: number;
  form: PostPropertyForm;
  isSubmitting: boolean;
  submitError: string;
  submittedPropertySlug: string;
  draftId: string | null;
  lastSaved: number | null; // epoch ms
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  config: {
    categories: PropConfigCategory[];
    types: PropConfigType[];
    amenities: PropConfigAmenity[];
    fields: PropConfigField[];
    loadingCategories: boolean;
    loadingTypes: boolean;
    loadingAmenities: boolean;
    loadingFields: boolean;
  };
}

const initialState: PostPropertyState = {
  currentStep: 0,
  totalSteps: 11,
  form: initialFormState,
  isSubmitting: false,
  submitError: '',
  submittedPropertySlug: '',
  draftId: null,
  lastSaved: null,
  autoSaveStatus: 'idle',
  config: {
    categories: [],
    types: [],
    amenities: [],
    fields: [],
    loadingCategories: false,
    loadingTypes: false,
    loadingAmenities: false,
    loadingFields: false,
  },
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
    setDynamicField: (state, action: PayloadAction<{ key: string; value: string }>) => {
      state.form.dynamicFields[action.payload.key] = action.payload.value;
    },
    toggleAmenity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const idx = state.form.amenityIds.indexOf(id);
      if (idx === -1) state.form.amenityIds.push(id);
      else state.form.amenityIds.splice(idx, 1);
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
    setDraftId: (state, action: PayloadAction<string | null>) => {
      state.draftId = action.payload;
    },
    setAutoSaveStatus: (state, action: PayloadAction<'idle' | 'saving' | 'saved' | 'error'>) => {
      state.autoSaveStatus = action.payload;
    },
    setLastSaved: (state, action: PayloadAction<number | null>) => {
      state.lastSaved = action.payload;
    },
    // Config actions
    setConfigCategories: (state, action: PayloadAction<PropConfigCategory[]>) => {
      state.config.categories = action.payload;
      state.config.loadingCategories = false;
    },
    setConfigTypes: (state, action: PayloadAction<PropConfigType[]>) => {
      state.config.types = action.payload;
      state.config.loadingTypes = false;
    },
    setConfigAmenities: (state, action: PayloadAction<PropConfigAmenity[]>) => {
      state.config.amenities = action.payload;
      state.config.loadingAmenities = false;
    },
    setConfigFields: (state, action: PayloadAction<PropConfigField[]>) => {
      state.config.fields = action.payload;
      state.config.loadingFields = false;
    },
    setConfigLoading: (state, action: PayloadAction<{ key: 'categories' | 'types' | 'amenities' | 'fields'; value: boolean }>) => {
      const k = action.payload.key;
      if (k === 'categories') state.config.loadingCategories = action.payload.value;
      else if (k === 'types') state.config.loadingTypes = action.payload.value;
      else if (k === 'amenities') state.config.loadingAmenities = action.payload.value;
      else if (k === 'fields') state.config.loadingFields = action.payload.value;
    },
  },
});

export const {
  setStep, nextStep, prevStep,
  updateForm, setDynamicField, toggleAmenity,
  resetForm,
  setSubmitting, setSubmitError, setSubmittedSlug,
  setDraftId, setAutoSaveStatus, setLastSaved,
  setConfigCategories, setConfigTypes, setConfigAmenities, setConfigFields, setConfigLoading,
} = postPropertySlice.actions;

export default postPropertySlice.reducer;
