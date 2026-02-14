// src/config.js

export const AGENCY_CONFIG = {
  brand: {
    name: "YUGEN",
    suffix: "HUB",
    primaryColor: "#ef4444",
  },

  // GLOBAL SETTINGS (From your old Schema)
  statusOptions: [
    { id: 'enquiry', label: 'Enquiry', color: '#71717a', fixed: true },
    { id: 'booked', label: 'Booked', color: '#3b82f6', fixed: true },
    { id: 'ongoing', label: 'Ongoing', color: '#a855f7', fixed: true },
    { id: 'completed', label: 'Completed', color: '#22c55e', fixed: true },
    { id: 'cancelled', label: 'Cancelled', color: '#ef4444', fixed: true }
  ],

  leadSources: ['Instagram', 'WhatsApp', 'Website', 'Referral', 'Event', 'Other'],

  // COMMON DELIVERABLES
  deliverableTypes: ['Cinematic Film', 'Teaser', 'Traditional Video', 'Raw Photos', 'Edited Photos', 'Wedding Album'],

  verticals: [
    {
      id: 'knots',
      label: 'Knots',
      description: 'Weddings',
      fields: [
        { name: 'client_side', label: 'Client Side', type: 'select', options: ['Groom', 'Bride', 'Both'] },
        { name: 'groom_name', label: 'Groom Name', type: 'text' },
        { name: 'bride_name', label: 'Bride Name', type: 'text' },
        { name: 'groom_number', label: 'Groom Number', type: 'tel' },
        { name: 'bride_number', label: 'Bride Number', type: 'tel' },
      ]
    },
    {
      id: 'pluto',
      label: 'Pluto',
      description: 'Kids',
      fields: [
        { name: 'child_name', label: 'Child Name', type: 'text' },
        { name: 'child_age', label: 'Age', type: 'number' },
        { name: 'occasion_type', label: 'Occasion', type: 'select', options: ['Birthday', 'Baptism', 'Newborn', 'Other'] }
      ]
    },
    {
      id: 'festia',
      label: 'Festia',
      description: 'Events',
      fields: [
        { name: 'event_scale', label: 'Scale', type: 'select', options: ['Private', 'Corporate', 'Mass'] },
        { name: 'company_name', label: 'Company Name', type: 'text' }
      ]
    },
    {
      id: 'thryv',
      label: 'Thryv',
      description: 'Marketing',
      fields: [
        { name: 'service_type', label: 'Service', type: 'text' }
      ]
    }
  ]
};