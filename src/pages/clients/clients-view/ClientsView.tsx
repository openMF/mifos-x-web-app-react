// MXWAR-70: Define dropdown options based on Client Status and Permissions
  const dropdownOptions = [
    { 
      label: 'Edit', 
      path: `clients/${client?.id}/edit`, 
      requiredPermission: 'UPDATE_CLIENT' 
    },
    // Only show "Activate" if the client is Pending (Status ID: 100)
    ...(client?.status?.id === 100 ? [
      { 
        label: 'Activate', 
        path: `clients/${client?.id}/activate`, 
        requiredPermission: 'ACTIVATE_CLIENT' 
      },
      { 
        label: 'Reject', 
        path: `clients/${client?.id}/reject`, 
        requiredPermission: 'REJECT_CLIENT' 
      },
      { 
        label: 'Withdraw', 
        path: `clients/${client?.id}/withdraw`, 
        requiredPermission: 'WITHDRAW_CLIENT' 
      },
    ] : []),
    {
      label: 'Applications',
      children: [
        { label: 'New Loan Account', path: `clients/${client?.id}/new-loan`, requiredPermission: 'CREATE_LOAN' },
        { label: 'New Savings Account', path: `clients/${client?.id}/new-savings`, requiredPermission: 'CREATE_SAVINGSACCOUNT' },
        { label: 'New Share Account', path: 'signature', disabled: true },
        { label: 'New Recurring Deposit Account', path: 'signature', disabled: true },
        { label: 'New Fixed Deposit Account', path: 'signature', disabled: true },
      ],
    },
    {
      label: 'Actions',
      children: [
        // Only show "Close" if the client is Active (Status ID: 300)
        ...(client?.status?.id === 300 ? [
            { label: 'Close', path: `clients/${client?.id}/close`, requiredPermission: 'CLOSE_CLIENT' },
            { label: 'Transfer Clients', path: `clients/${client?.id}/transfer`, requiredPermission: 'TRANSFERCLIENT_CLIENT' },
        ] : []),
        { label: 'Assign Staff', path: `clients/${client?.id}/assign-staff`, requiredPermission: 'ASSIGNSTAFF_CLIENT' },
      ],
    },
    { 
      label: 'Unassign Staff', 
      path: `clients/${client?.id}/unassign-staff`, 
      requiredPermission: 'UNASSIGNSTAFF_CLIENT' 
    },
    {
      label: 'More',
      children: [
        { label: 'Add Charge', path: `clients/${client?.id}/add-charge`, requiredPermission: 'CREATE_CLIENTCHARGE' },
        { label: 'Upload Signature', path: `clients/${client?.id}/upload-signature`, requiredPermission: 'CREATE_CLIENTIMAGE' },
        { label: 'Delete Signature', path: `clients/${client?.id}/delete-signature`, requiredPermission: 'DELETE_CLIENTIMAGE' },
        { label: 'Create Standing Instructions', path: `clients/${client?.id}/create-standing-instruction`, requiredPermission: 'CREATE_STANDINGINSTRUCTION' },
        { label: 'View Standing Instructions', path: `clients/${client?.id}/view-standing-instruction`, requiredPermission: 'READ_STANDINGINSTRUCTION' },
      ],
    },
  ].filter(option => 
    !option.requiredPermission || 
    permissions.includes(option.requiredPermission) || 
    hasAllFunctions
  )