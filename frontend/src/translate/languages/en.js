const messages = {
  en: {
    translations: {
      paywall: {
        changeTitle: "Time to switch plans?",
        changeText:
          "Go up or down whenever you want. Upgrades are paid now; downgrades cost nothing today — your next charge already comes with the new price.",
        currentBadge: "YOUR CURRENT PLAN",
        upgradeBadge: "UPGRADE ↑",
        downgradeBadge: "DOWNGRADE ↓",
        currentBtn: "Current plan",
        upgradeBtn: "Upgrade",
        downgradeBtn: "Switch to this plan",
        changedTitle: "Plan changed!",
        changedText:
          "You're now on {{plan}}. Your next charge, on {{date}}, already comes with the new price.",
        title: "Oops! Your access has expired",
        voluntaryTitle: "Choose your plan",
        adminText:
          "Your period is over and we have bills to pay too 😅 Pick a plan and unlock the system right now — 30 days from the payment date.",
        voluntaryText: "Pay now and get 30 days from the payment date.",
        userText:
          "Your company's access is suspended. Ask your administrator to renew the subscription.",
        perMonth: "/month",
        users: "Up to {{count}} users",
        connections: "{{count}} connections",
        queues: "{{count}} queues",
        pay: "Pay {{value}}",
        logout: "Log out",
        later: "Not now",
        thanksTitle: "Payment confirmed!",
        thanksText:
          "Thank you so much for trusting us. Your access is unlocked for 30 more days.",
        continue: "Continue"
      },
      network: {
        reconnected: "Connected again",
        server: "Server not responding, retrying…",
        reconnecting: "Reconnecting…",
        sending: "Sending file…",
        loading: "Loading…",
        slow: "Slow connection",
        backOnline: "Back online 🎉",
        offlineTitle: "Your internet stepped out for coffee",
        offlineText:
          "We whistled at the router and got nothing back. The moment it returns, we pick up right where you left off.",
        retry: "Try again"
      },
      payment: {
        cardPreview: {
          holder: "Cardholder",
          holderPlaceholder: "Name on card",
          expiry: "Expires",
          ccv: "Security code"
        },
        title: "Subscription payment",
        pix: "Pix",
        card: "Card",
        boleto: "Bank slip",
        payNow: "Pay now",
        processing: "Processing…",
        paid: "Payment approved!",
        copied: "Copied",
        copyCode: "Copy Pix code",
        copyLine: "Copy barcode line",
        openBoleto: "Open bank slip",
        pixIntro:
          "We will generate a Pix QR code. The payment clears instantly.",
        pixHint:
          "Open your bank app, choose Pix > Scan QR code and point at the image.",
        boletoIntro:
          "We generate the bank slip PDF with its barcode. Clearing takes up to 3 business days.",
        boletoHint: "The bank slip was also sent to the company e-mail.",
        cardIntro:
          "Charged right away. You can save the card so the next months are charged automatically.",
        cardApproved: "Card approved! Your subscription is up to date.",
        cardPending:
          "Charge sent. As soon as the bank confirms, your subscription renews.",
        cardSaved: "Saved card: {{card}}",
        saveCard: "Save card for automatic charges",
        saveCardHint:
          "We only keep a secure code (token), never the card number.",
        autoCharge: "Automatic charge on · {{card}}",
        removeCard: "Remove saved card",
        cardRemoved: "Card removed",
        noMethods: "No payment method is enabled. Contact support.",
        form: {
          holder: "Name on card",
          number: "Card number",
          expiry: "Expiry (MM/YYYY)",
          ccv: "CVV",
          cpfCnpj: "Tax ID",
          email: "E-mail",
          phone: "Mobile",
          postalCode: "Postal code",
          addressNumber: "Number"
        }
      },
      paymentGateways: {
        intro:
          "Choose what customers can use to pay. Anything turned off is hidden from them.",
        pix: {
          title: "Pix",
          provider: "Efí (Gerencianet)",
          how: "The customer scans a QR code and the money lands instantly in your Efí account.",
          steps: [
            "Create a Pix application in Efí and generate the certificate (.p12).",
            "Fill in the Client ID, Client Secret, Pix key and upload the certificate below.",
            "The system registers the payment webhook in Efí by itself.",
            "On payment, the invoice is settled and the company's due date moves forward."
          ]
        },
        card: {
          title: "Credit card",
          provider: "Asaas",
          how: "Charged instantly. With the card saved, the following months are charged automatically.",
          steps: [
            "Create an Asaas account and generate the API key (Integrations > API).",
            "Paste the key below and pick Sandbox (testing) or Production.",
            "Register the notification URL below in Asaas (Integrations > Webhooks) with the same token.",
            "Ask Asaas to enable card tokenization to use automatic charges in production.",
            "Every day at 9am the system charges the saved card for invoices that are due."
          ]
        },
        boleto: {
          title: "Bank slip",
          provider: "Asaas",
          how: "Generates the bank slip PDF with barcode; clearing takes up to 3 business days.",
          steps: [
            "Uses the same Asaas account and key as the card.",
            "The customer gets the slip on screen and by e-mail.",
            "When the bank confirms, Asaas notifies the webhook and the invoice is settled."
          ]
        },
        asaas: {
          key: "Asaas API key",
          env: "Environment",
          sandbox: "Sandbox (testing)",
          production: "Production",
          webhookToken: "Webhook token",
          webhookUrl: "Register this URL in Asaas (Integrations > Webhooks):"
        }
      },
      revenue: {
        monthly: "Monthly revenue",
        monthlySub: "{{count}} active client",
        monthlySub_plural: "{{count}} active clients",
        next30: "Due in 30 days",
        next30Sub: "Next month's due dates",
        overdue: "Overdue",
        overdueSub: "{{count}} client",
        overdueSub_plural: "{{count}} clients",
        autoCharge: "Automatic charge",
        autoChargeSub: "Clients with a saved card",
        forecast: "Next 6 months forecast",
        expected: "Expected",
        clients: "Clients",
        search: "Search client",
        empty: "No client with billing set up.",
        value: "Amount",
        nextDue: "Next due date",
        status: "Status",
        charge: "Charge",
        noPlan: "No plan",
        noDate: "No due date",
        today: "Due today",
        inDays: "In {{count}} day",
        inDays_plural: "In {{count}} days",
        lateBy: "{{count}} day late",
        lateBy_plural: "{{count}} days late",
        auto: "Automatic",
        manualCharge: "Manual",
        recurrence: {
          MENSAL: "Monthly",
          BIMESTRAL: "Every 2 months",
          TRIMESTRAL: "Quarterly",
          SEMESTRAL: "Every 6 months",
          ANUAL: "Yearly"
        }
      },
      planFeatures: {
        lockedTitle: "{{feature}} is not in your plan",
        lockedText:
          "This feature belongs to another plan. Talk to the platform administrator to enable it.",
        lockedAction: "See my plan",
        names: {
          useKanban: "Kanban",
          useInternalChat: "Internal chat",
          useSchedules: "Scheduled messages",
          useCampaigns: "Campaigns",
          useExternalApi: "Messages API"
        },
        hints: {
          useKanban: "Board with conversations in columns by stage.",
          useInternalChat: "Team conversations inside the system.",
          useSchedules: "Schedule messages for a date and time.",
          useCampaigns: "Bulk sending to contact lists.",
          useExternalApi: "Send messages from other systems, with a token."
        }
      },
      plansPage: {
        title: "Plans",
        subtitle: "Limits and features of each plan you sell.",
        new: "New plan",
        edit: "Edit plan",
        editShort: "Edit",
        delete: "Delete plan",
        templatesTitle: "Ready-made templates",
        templates: {
          start: "For those starting out, with one number.",
          pro: "Best seller: small team and scheduling.",
          business: "Large team, campaigns and API included.",
          enterprise: "Operations at scale, no limits."
        },
        featuresTitle: "Included features",
        popular: "Best seller",
        public: "Public",
        private: "Internal",
        perMonth: "/month",
        form: {
          name: "Plan name",
          value: "Monthly price",
          users: "Users",
          connections: "Inbox",
          queues: "Queues",
          currency: "Currency",
          public: "Shown on sign-up",
          publicHint:
            "Internal plans are only used by you when creating a company."
        },
        saved: "Plan saved",
        saveError:
          "Could not save. Check whether a plan with this name already exists.",
        loadError: "Could not load the plans",
        deleteTitle: "Delete {{name}}?",
        deleteText: "Companies using this plan will be left without one.",
        deleted: "Plan deleted",
        deleteError: "Could not delete the plan"
      },
      queuesPage: {
        subtitle:
          "Organize service by department and build each queue's automatic menu.",
        emptyTitle: "No queues yet",
        emptyText:
          "Create queues like Sales, Support or Billing to distribute tickets.",
        chatbot: "Chatbot · {{count}} option",
        chatbot_plural: "Chatbot · {{count}} options",
        noChatbot: "No chatbot",
        hours: "Business hours set",
        noGreeting: "No greeting message",
        users: "Agents",
        connections: "Inbox",
        tickets: "Open + waiting",
        edit: "Edit",
        delete: "Delete",
        new: "New queue"
      },
      loginShowcase: {
        title: "All your company's conversations in one place",
        text: "WhatsApp, team and customers in the same dashboard — with Kanban, scheduling and reports."
      },
      annotator: {
        title: "Document",
        annotate: "Draw",
        typeHere: "Type here",
        tools: {
          pan: "Move",
          pen: "Draw",
          highlight: "Highlight",
          underline: "Underline",
          strike: "Strike",
          text: "Text",
          eraser: "Eraser"
        },
        sizes: {
          thin: "Thin",
          medium: "Medium",
          thick: "Thick"
        },
        undo: "Undo (Ctrl+Z)",
        redo: "Redo (Ctrl+Shift+Z)",
        clear: "Clear this page's annotations",
        download: "Download",
        downloadAnnotated: "Download with annotations",
        send: "Send to chat",
        sent: "Annotated file sent",
        done: "Done",
        error: "Could not open the file.",
        loadingPreview: "Loading preview…",
        previewUnavailable: "Preview unavailable",
        openAndAnnotate: "Open and annotate"
      },
      superDashboard: {
        title: "Platform dashboard",
        live: "Live",
        tabs: {
          platform: "Overview",
          revenue: "Revenue",
          companies: "Companies",
          mine: "My company"
        },
        server: "Server",
        cpu: "CPU",
        cpuSub: "{{cores}} cores · load {{load}}",
        ram: "RAM",
        app: "app",
        disk: "Disk space",
        free: "{{size}} free",
        database: "Database",
        processSub: "Backend {{rss}} · up {{uptime}} · {{online}} online",
        platform: "Platform usage",
        companies: "Active companies",
        ofTotal: "of {{total}} registered",
        users: "Users",
        onlineNow: "{{count}} online now",
        connections: "Inbox",
        connected: "connected",
        tickets: "Open tickets",
        pending: "{{count}} waiting",
        messagesToday: "Messages today",
        last30: "{{count}} in 30 days",
        storage: "Storage",
        contacts: "{{count}} contacts",
        activity: "Messages in the last 14 days",
        sent: "Sent",
        received: "Received",
        ranking: "Usage by company",
        metrics: {
          messages30d: "Messages",
          tickets30d: "Tickets",
          storage: "Disk",
          users: "Users"
        },
        clients: "Clients",
        search: "Search company",
        active: "Active",
        blocked: "Blocked",
        dueIn: "due in {{count}} day",
        dueIn_plural: "due in {{count}} days",
        overdue: "overdue by {{count}} day",
        overdue_plural: "overdue by {{count}} days",
        max: "max {{count}}",
        onlineShort: "online",
        openShort: "open",
        messagesShort: "msgs 30d",
        usersOf: "{{count}} user created",
        usersOf_plural: "{{count}} users created",
        online: "Online",
        offline: "Offline",
        inactive: "inactive",
        userStats: "{{open}} open · {{sent}} msgs sent in 30 days",
        newAdmin: "New administrator",
        newAdminHint:
          "The administrator creates and manages their company's users.",
        adminCreated: "Administrator created",
        create: "Create",
        form: {
          name: "Name",
          email: "Email",
          password: "Password"
        }
      },
      contactSchedules: {
        title: "Scheduled messages",
        new: "Schedule",
        empty: "No messages scheduled for this contact.",
        pending: "{{count}} to send",
        pending_plural: "{{count}} to send",
        in: "goes out in {{time}}",
        soon: "sending now",
        sentAgo: "sent {{time}}",
        failedAgo: "failed {{time}}",
        all: "See all ({{count}})",
        less: "Show less",
        status: {
          pending: "Scheduled",
          sent: "Sent",
          error: "Error"
        }
      },
      financePage: {
        changePlan: "Change plan",
        pageTitle: "My Subscription",
        pageSubtitle: "Manage your plan, payment and history in one place.",
        currentPlan: "Current subscription",
        planBenefits: "Plan benefits",
        noPlan: "No plan",
        valuePaid: "Amount paid",
        planValue: "Plan price",
        expiresOn: "Expires on",
        expiredOn: "Expired on",
        upgradeTitle: "Upgrade your plan to",
        upgradeText:
          "With the upgrade you get {{users}} users and {{connections}} connections and unlock new features for your operation.",
        upgradeBtn: "Upgrade",
        historyTitle: "Payment history",
        seeAll: "See all",
        seeLess: "See less",
        statusPaid: "Approved",
        renewalTitle: "Renewal",
        cardActive: "Active",
        cardPaused: "Paused",
        cardExpires: "Expires {{date}}",
        cardSaved: "Saved card",
        cardMenu: "Card options",
        cardRemove: "Remove card",
        cardRemoveConfirm:
          "Remove the saved card? Automatic renewal stops until you save another card.",
        autoRenewOn: "Automatic renewal on",
        autoRenewOff: "Automatic renewal off",
        cardNote: "This card is used to renew your current subscription.",
        noCard: "No saved card",
        noCardNote:
          'When paying by card, check "Save card" to renew automatically.',
        addCard: "Add card",
        addressTitle: "Address",
        addressUpdate: "Update address",
        addressEmpty: "No address on file.",
        addressNumber: "No. {{number}}",
        alertOpen: "{{value}} invoice open",
        plansDialogTitle: "Plans and benefits",
        close: "Close",
        address: {
          title: "Billing address",
          postalCode: "ZIP code",
          street: "Street",
          number: "Number",
          complement: "Complement",
          district: "District",
          city: "City",
          state: "State",
          save: "Save",
          cancel: "Cancel",
          saved: "Address updated",
          cepNotFound: "ZIP code not found"
        },
        plansTitle: "Plans",
        perMonth: "/month",
        planUsers: "{{count}} user",
        planUsers_plural: "{{count}} users",
        planConnections: "{{count}} connection",
        planConnections_plural: "{{count}} connections",
        planQueues: "{{count}} queue",
        planQueues_plural: "{{count}} queues",
        planChat: "Internal chat",
        planSchedules: "Schedules",
        planApi: "Integration API",
        planCurrent: "YOUR PLAN",
        planYours: "Current plan",
        planChoose: "Choose this plan",
        planChoosing: "Preparing…",
        methodsTitle: "Payment methods",
        methodPix: "Pix",
        methodCard: "Credit card",
        methodBoleto: "Bank slip",
        savedCardHint: "Charged automatically on this card every month.",
        savedCardRemove: "Remove",
        title: "Billing",
        subtitle: "Keep track of your subscription and invoices.",
        days: "day",
        days_plural: "days",
        heroOk: "All good! {{count}} day until renewal",
        heroOk_plural: "All good! {{count}} days until renewal",
        heroToday: "Your subscription renews today",
        heroSub: "Your access is guaranteed until {{date}}.",
        heroOverdue: "Your subscription expired {{count}} day ago",
        heroOverdue_plural: "Your subscription expired {{count}} days ago",
        heroOverdueSub:
          "Pay the open invoice to keep using it without interruptions.",
        payNow: "Pay now",
        statOpen: "Outstanding",
        statPending: "To pay",
        statPaid: "Paid",
        history: "Invoices",
        emptyTitle: "No invoices yet",
        emptyText: "When there is an invoice, it will show up here.",
        invoice: "Subscription",
        number: "Invoice #{{id}}",
        paid: "Paid",
        dueToday: "Due today",
        dueTomorrow: "Due tomorrow",
        daysLeft: "{{count}} day left",
        daysLeft_plural: "{{count}} days left",
        overdueFor: "Overdue by {{count}} day",
        overdueFor_plural: "Overdue by {{count}} days",
        dueOn: "Due on {{date}}",
        dueWas: "Was due on {{date}}",
        pay: "Pay",
        paidBtn: "Paid ✓"
      },
      forwardModal: {
        title: "Forward message to",
        search: "Search name or number",
        recent: "Recent chats",
        contacts: "Contacts",
        empty: "No contacts found",
        group: "Group",
        remove: "Remove",
        max: "You can forward to up to {{count}} chats",
        caption: "Add a message",
        send: "Forward",
        sent: "Message forwarded",
        sent_plural: "Message forwarded to {{count}} chats",
        queue: "Queue: {{name}}",
        queueHint: "Queue used when the contact has no open ticket",
        media: {
          image: "Photo",
          video: "Video",
          audio: "Audio",
          document: "File",
          sticker: "Sticker"
        }
      },
      instances: {
        summary: "{{connected}} of {{total}} connected",
        new: "New connection",
        noProfile: "Profile shows up once connected",
        updated: "Updated {{time}}",
        default: "Default connection",
        channel: "Channel",
        queues: "Queues",
        lastUpdate: "Last update",
        yes: "Yes",
        no: "No",
        status: {
          CONNECTED: "Connected",
          qrcode: "Waiting for QR code",
          passkey_required: "Passkey required",
          PAIRING: "Phone not responding",
          TIMEOUT: "Phone not responding",
          OPENING: "Connecting…",
          DISCONNECTED: "Disconnected"
        },
        actions: {
          scan: "Scan QR code",
          retry: "Reconnect",
          passkey: "Use passkey",
          newQr: "New QR code",
          resetPasskey: "Reset passkey",
          disconnect: "Disconnect",
          refresh: "Refresh session",
          edit: "Settings",
          privacy: "Privacy",
          delete: "Delete"
        }
      },
      orientation: {
        title: "Rotate your phone",
        text: "vuup.me is designed for portrait mode. Turn your device upright to continue."
      },
      ticketHeaderActions: {
        resolve: "Resolve",
        resolveHint: "Mark as done and close the ticket",
        resolved: "Ticket resolved",
        transfer: "Transfer",
        transferHint: "Hand over to another queue or agent",
        return: "Return to queue",
        returnHint: "Goes back to Waiting, without an agent",
        schedule: "Schedule message",
        scheduleHint: "Schedule a message to this contact",
        delete: "Delete ticket",
        deleteHint: "Removes the ticket and its messages",
        reopen: "Reopen",
        more: "More actions"
      },
      usersPage: {
        subtitle: "Who can sign in and handle chats for your company.",
        filters: {
          all: "All",
          active: "Active",
          inactive: "Inactive"
        },
        active: "Active",
        inactive: "Inactive",
        activateHint: "Allow this user to sign in",
        deactivateHint: "Block access: the person is signed out right away",
        selfHint: "You can't deactivate yourself",
        activated: "{{name}} is active",
        deactivated: "{{name}} was deactivated",
        edit: "Edit",
        delete: "Delete",
        deactivatedByAdmin: "Your access was disabled by the administrator."
      },
      chatWallpaper: {
        tabs: {
          gif: "Animated",
          image: "Photos",
          color: "Colors",
          classic: "Classic"
        },
        title: "Chat background",
        subtitle:
          "Drawn with the colors of the selected theme. Your message bubbles follow the palette too.",
        sampleIn: "Hi! How are you? 😊",
        sampleOut: "Great, how can I help?",
        options: {
          landscape: "Landscape",
          waves: "Waves",
          gradient: "Gradient",
          doodle: "Doodles",
          plain: "Plain"
        }
      },
      date: {
        yesterday: "Yesterday"
      },
      common: {
        yesterday: "Yesterday",
        today: "Today",
        search: "Search",
        emptyTitle: "Nothing here yet",
        emptyDescription:
          "Records will show up in this list as soon as there are any.",
        emptySearchTitle: "No results",
        emptySearchDescription:
          "Nothing matches your search. Try another term.",
        filter: "Filter",
        edit: "Edit",
        delete: "Delete",
        cancel: "Cancel",
        save: "Save",
        confirm: "Confirm",
        confirmation: "Confirmation",
        areyousure: "Are you sure?",
        close: "Close",
        back: "Back",
        closed: "Closed",
        error: "Error",
        success: "Success",
        actions: "Actions",
        add: "Add",
        name: "Name",
        email: "Email",
        phone: "Phone",
        language: "Language",
        company: "Company",
        user: "User",
        users: "Users",
        connection: "Connection",
        connections: "Inbox",
        queue: "Queue",
        queues: "Queues",
        contact: "Contact",
        messages: "Messages",
        whatsappNumber: "WhatsApp Number",
        dueDate: "Due Date",
        copy: "Copy",
        paste: "Paste",
        proceed: "Proceed",
        enabled: "Enabled",
        disabled: "Disabled",
        undefined: "Undefined",
        yes: "Yes",
        no: "No",
        noqueue: "No queue",
        rating: "Rating",
        transferTo: "Transfer to",
        key: "Key",
        value: "Value",
        validations: {
          required: "This field is required",
          short: "Value too short",
          long: "Value too long",
          invalid: "Invalid value",
          invalidEmail: "Invalid email",
          invalidPhone: "Invalid phone number"
        },
        status: "Status",
        serverTime: "Server time:",
        clientTime: "Client time:",
        differenceMinutes: "Difference: {{count}} minute(s)"
      },
      signup: {
        options: {
          segment: {
            retail: "Retail / Store",
            services: "Services",
            health: "Health & wellness",
            education: "Education",
            food: "Food",
            realEstate: "Real estate",
            tech: "Technology",
            other: "Other"
          },
          teamSize: {
            1: "Just me",
            "2-5": "2 to 5 people",
            "6-20": "6 to 20 people",
            "21-50": "21 to 50 people",
            "50+": "More than 50"
          },
          goal: {
            sales: "Sell more",
            support: "Customer support",
            scheduling: "Appointments",
            marketing: "Campaigns & marketing",
            other: "Other"
          },
          source: {
            google: "Google",
            instagram: "Instagram",
            youtube: "YouTube",
            referral: "Referral",
            other: "Other"
          }
        },
        aboutBusiness: "About your business",
        subheading: "7 days free. No credit card required.",
        heading: "Create your account",
        title: "Sign Up",
        toasts: {
          success: "User created successfully! Log in now!!!",
          fail: "Error creating user. Check the provided data."
        },
        form: {
          source: "How did you find us?",
          goal: "Main goal",
          teamSize: "Team size",
          segment: "Industry",
          name: "Name",
          email: "Email",
          password: "Password"
        },
        buttons: {
          submit: "Sign Up",
          login: "Already have an account? Log in!"
        }
      },
      forgotPassword: {
        heading: "Forgot your password?",
        subheading:
          "Enter your email and we'll send you a link to create a new password.",
        email: "Email",
        submit: "Send link",
        sentHeading: "Check your email",
        sent: "If there is an account for {{email}}, you will receive a link to create a new password. It is valid for 30 minutes.",
        back: "Back to login"
      },
      resetPassword: {
        heading: "Create a new password",
        subheading: "Use at least 6 characters.",
        password: "New password",
        confirm: "Repeat the new password",
        submit: "Save password",
        mismatch: "The passwords don't match.",
        success: "Password changed. Log in with your new password.",
        invalid: "This link is not valid. Request a new one.",
        requestNew: "Request a new link"
      },
      login: {
        forgot: "Forgot my password",
        code: {
          heading: "Confirm it's you",
          subheading:
            "We sent a 6-digit code to {{email}}. It is valid for 10 minutes.",
          label: "Code",
          submit: "Confirm",
          resend: "Resend code",
          resendIn: "Resend in {{seconds}}s",
          resent: "We sent a new code.",
          back: "Back",
          hint: "After that, this browser will be trusted."
        },
        subheading: "Sign in to continue your conversations.",
        heading: "Welcome back",
        title: "Login",
        form: {
          email: "Email",
          password: "Password"
        },
        buttons: {
          submit: "Log In",
          register: "Don't have an account? Sign up!"
        }
      },
      companies: {
        title: "Register Company",
        form: {
          name: "Company Name",
          plan: "Plan",
          token: "Token",
          submit: "Register",
          success: "Company created successfully!"
        }
      },
      companiesManager: {
        form: {
          campaigns: "Campaigns",
          recurrence: "Recurrence",
          monthly: "Monthly",
          bimonthly: "Bimonthly",
          quarterly: "Quarterly",
          semiannual: "Semiannual",
          annual: "Annual"
        },
        buttons: {
          clear: "Clear",
          accessAs: "Access as",
          incrementDueDate: "+ Due Date",
          user: "User"
        },
        table: {
          storage: "Storage",
          campaigns: "Campaigns",
          createdAt: "Created At"
        },
        toasts: {
          loadError: "Could not load the record list",
          operationSuccess: "Operation completed successfully",
          operationError: "Could not perform the operation",
          operationErrorDuplicate:
            "Could not perform the operation. Check if a company with the same name already exists or if the fields were filled correctly"
        },
        confirmationModal: {
          deleteTitle: "Delete Record",
          deleteMessage: "Do you really want to delete this record?",
          impersonateTitle: "Access as",
          impersonateMessage:
            "Do you want to access the system as this company?"
        }
      },
      auth: {
        toasts: {
          success: "Login successful!"
        },
        token: "Token"
      },
      dashboard: {
        sections: {
          now: "Right now",
          nowHint: "Real-time status",
          period: "In the period",
          periodHint: "Numbers for the selected range",
          team: "Team",
          teamHint: "Each agent's performance in the period"
        },
        team: {
          online: "Online now",
          offline: "Offline",
          total: "Total",
          open: "Open",
          closed: "Resolved",
          wait: "Wait",
          service: "Service"
        },
        usersOnline: "Users online",
        ticketsWaiting: "Tickets waiting",
        ticketsOpen: "Open tickets",
        ticketsDone: "Resolved tickets",
        totalTickets: "Total tickets",
        newContacts: "New contacts",
        avgServiceTime: "Average service time",
        avgWaitTime: "Average wait time",
        ticketsOnPeriod: "Tickets in the period",
        userCurrentStatus: "Current status",
        filter: {
          invalid: "Choose a valid period to filter.",
          period: "Period",
          custom: "Custom",
          last3days: "Last 3 days",
          last7days: "Last 7 days",
          last14days: "Last 14 days",
          last30days: "Last 30 days",
          last90days: "Last 90 days"
        },
        date: {
          start: "Start date",
          end: "End date"
        },
        ticketCountersLabels: {
          created: "Created",
          closed: "Closed"
        }
      },
      connections: {
        title: "Inboxes",
        toasts: {
          deleted: "WhatsApp connection successfully deleted!"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "Are you sure? This action cannot be undone.",
          disconnectTitle: "Disconnect",
          disconnectMessage:
            "Are you sure? You will need to scan the QR Code again to reconnect. Nothing is deleted on WhatsApp.",
          purge:
            "Delete everything from this connection: tickets, messages, media and the contacts that only talked through it. This can't be undone.",
          purgeOnDelete: "Delete all conversations from this connection",
          purgeOnDeleteHint:
            "Tickets, messages, media and the contacts that only talked through it. This can't be undone.",
          closeTickets: "Close all open tickets from this connection"
        },
        buttons: {
          add: "Add inbox",
          disconnect: "Disconnect",
          tryAgain: "Try Again",
          qrcode: "QR CODE",
          newQr: "New QR CODE",
          connecting: "Connecting"
        },
        toolTips: {
          disconnected: {
            title: "Failed to initiate WhatsApp session",
            content:
              "Make sure your phone is connected to the internet and try again, or request a new QR Code."
          },
          qrcode: {
            title: "Waiting for QR Code scan",
            content:
              "Click the 'QR CODE' button and scan the QR Code with your phone to start the session."
          },
          connected: {
            title: "Connection established!"
          },
          timeout: {
            title: "Connection to the phone has been lost",
            content:
              "Make sure your phone is connected to the internet and WhatsApp is open, or click 'Disconnect' to get a new QR Code."
          },
          passkey: {
            title: "Passkey authentication required",
            content:
              "Click the passkey button and use the browser extension to capture the authenticated WhatsApp Web session."
          },
          refresh: "Refresh",
          disconnect: "Disconnect",
          scan: "Scan QR Code",
          newQr: "Request new QR Code",
          retry: "Try Again",
          resetPasskey: "Reset passkey session"
        },
        table: {
          name: "Name",
          status: "Status",
          lastUpdate: "Last Update",
          default: "Default",
          actions: "Actions",
          session: "Session"
        }
      },
      trialBanner: {
        daysLeft: "Your free trial ends in {{count}} days",
        tomorrow: "Your free trial ends tomorrow",
        today: "Your free trial ends today",
        ended: "Your free trial has ended",
        cta: "Subscribe now"
      },
      mediaPreview: {
        add: "Add file",
        captionPlaceholder: "Add a caption…",
        position: "{{current}} of {{total}}",
        files: "files",
        remove: "Remove",
        send: "Send"
      },
      internalChat: {
        channelsCount_plural: "{{count}} channels",
        channelsCount: "{{count}} channel",
        newChannel: "Create channel",
        allAreas: "All conversations",
        areas: "Areas",
        areaHelp: "Channels are grouped by area in the bubbles on the left.",
        areaPlaceholder: "E.g.: Sales, Support, Finance",
        area: "Area",
        title: "Internal Chat",
        subtitle: "Conversations with your team",
        newChat: "New conversation",
        emptyListTitle: "No conversations yet",
        emptyListDescription:
          "Create a conversation and choose who on your team joins.",
        selectTitle: "Select a conversation",
        selectDescription:
          "Pick a conversation from the list or start a new one with your team.",
        participants: "participants",
        typeMessage: "Type a message",
        edit: "Edit",
        delete: "Delete",
        deleteTitle: "Delete conversation",
        deleteMessage: "This action cannot be undone. Continue?",
        you: "You"
      },
      whatsappModal: {
        title: {
          add: "Add inbox",
          edit: "Edit WhatsApp"
        },
        form: {
          name: "Name",
          default: "Default"
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "WhatsApp saved successfully."
      },
      qrCode: {
        message: "Scan the QR Code to start the session",
        extensionHint: "Authenticate through WhatsApp Web",
        startCapture: "Capture WhatsApp Web session",
        installExtension: "Install Capture Extension"
      },
      passkeyModal: {
        title: "Capture WhatsApp Web Extension",
        instructions:
          "Use the browser extension to capture the authenticated WhatsApp Web session and send it to the server.",
        connectorNotFound:
          "Extension not detected. Install the passkey capture extension and reload the page.",
        connectorReady:
          "Extension detected. Click below to authenticate through WhatsApp Web.",
        startCapture: "Start Capture",
        waitingForCapture: "Waiting for WhatsApp Web session capture…",
        existingSession: "WhatsApp Web already has a session for {{number}}.",
        captureExisting: "Capture this session",
        clearAndContinue: "Clear local session and continue",
        importSent: "Session captured and sent successfully.",
        importError: "Capture failed: {{reason}}.",
        missingToken: "Capture token is missing. Please reload the page.",
        downloadExtension: "Download capture extension",
        installInstructions: "How to install",
        hideInstructions: "Hide instructions",
        instructionsIntro: "Follow the steps below to install the extension:",
        installStep1: "Download the extension ZIP file.",
        installStep2: "Extract the ZIP file to a folder on your computer.",
        installStep3: "Open Google Chrome and go to chrome://extensions/.",
        installStep4:
          "Enable Developer mode using the toggle in the top-right corner.",
        installStep5: 'Click "Load unpacked".',
        installStep6:
          "Select the extracted folder containing the extension files.",
        installStep7: "The extension is now installed and ready to use.",
        installStep8: "Refresh this page with F5 and try to connect again."
      },
      contacts: {
        title: "Contacts",
        toasts: {
          imported:
            "Import started. Contacts will show up in the list shortly.",
          deleted: "Contact successfully deleted!"
        },
        searchPlaceholder: "Search...",
        confirmationModal: {
          deleteTitle: "Delete ",
          importTitlte: "Import Contacts",
          deleteMessage:
            "Are you sure you want to delete this contact? All related interactions will be lost.",
          importMessage: "Do you want to import all contacts from the phone?"
        },
        buttons: {
          importCsv: "Import from CSV file",
          exportCsv: "Export to CSV",
          import: "Import Contacts",
          add: "Add Contact"
        },
        table: {
          name: "Name",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions"
        }
      },
      contactModal: {
        title: {
          add: "Add Contact",
          edit: "Edit Contact"
        },
        form: {
          mainInfo: "Contact Information",
          extraInfo: "Additional Information",
          name: "Name",
          number: "WhatsApp Number",
          email: "Email",
          extraName: "Field Name",
          extraValue: "Value",
          disableBot: "Disable chatbot"
        },
        buttons: {
          addExtraInfo: "Add Information",
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "Contact saved successfully."
      },
      queueModal: {
        confirmationModal: {
          deleteTitle: "Delete file?",
          deleteMessage:
            "The attached file will be removed. This can't be undone."
        },
        title: {
          add: "Add Queue",
          edit: "Edit Queue"
        },
        form: {
          name: "Name",
          color: "Color",
          greetingMessage: "Greeting Message",
          complationMessage: "Completion Message",
          outOfHoursMessage: "Out of Hours Message",
          ratingMessage: "Rating Message",
          transferMessage: "Transfer Message",
          token: "Token"
        },
        toasts: {
          deleted: "File removed",
          saved: "Queue saved successfully"
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
          attach: "Attach File"
        },
        serviceHours: {
          dayWeek: "Day of the week",
          startTimeA: "Start Time - Shift A",
          endTimeA: "End Time - Shift A",
          startTimeB: "Start Time - Shift B",
          endTimeB: "End Time - Shift B",
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday",
          sunday: "Sunday"
        }
      },
      userModal: {
        photo: {
          add: "Add photo",
          change: "Change photo",
          remove: "Remove",
          hint: "JPG or PNG. Shown in the top bar, menu and internal chat.",
          saved: "Photo updated",
          removed: "Photo removed"
        },
        title: {
          add: "Add User",
          edit: "Edit User"
        },
        listItems: {
          adminProfile: "Administrator",
          userProfile: "User"
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Password",
          profile: "Profile"
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "User saved successfully."
      },
      scheduleModal: {
        mediaOrText: "Write a message or attach an image.",
        removeMedia: "Remove attachment",
        addMedia: "Add image",
        title: {
          add: "New Schedule",
          edit: "Edit Schedule"
        },
        form: {
          body: "Message",
          contact: "Contact",
          sendAt: "Scheduled Date",
          sentAt: "Sent Date",
          saveMessage: "Save Message in Ticket"
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "Schedule saved successfully."
      },
      tagModal: {
        title: {
          add: "New Tag",
          edit: "Edit Tag",
          addKanban: "New Lane",
          editKanban: "Edit Lane"
        },
        form: {
          name: "Name",
          color: "Color",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "Tag saved successfully.",
        successKanban: "Lane saved successfully."
      },
      chat: {
        noTicketMessage: "Select a ticket to start the conversation."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "DRAG AND DROP FILES IN THE FIELD BELOW",
          titleFileList: "List of file(s)"
        }
      },
      todolist: {
        title: "Tasks list",
        form: {
          name: "Task name"
        },
        buttons: {
          add: "Add",
          save: "Save"
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "New"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Queues"
      },
      tickets: {
        draft: "Draft",
        toasts: {
          deleted: "The ticket you were working on has been deleted."
        },
        notification: {
          message: "Message from",
          nomessages: "No messages"
        },
        tabs: {
          open: { title: "Open" },
          closed: { title: "Closed" },
          groups: { title: "Groups" },
          search: { title: "Search" }
        },
        search: {
          placeholder: "Search for ticket and messages",
          filterByTags: "Filter by tags",
          filterByUsers: "Filter by users"
        },
        buttons: {
          showAll: "All"
        }
      },
      transferTicketModal: {
        hintQueue:
          'Without an agent, the ticket goes back to "Waiting" in the chosen queue.',
        hintUser: "Goes straight to {{name}}, already in progress.",
        userLabel: "Agent (optional)",
        title: "Transfer Ticket",
        fieldLabel: "Type to search for users",
        fieldQueueLabel: "Transfer to queue",
        fieldQueuePlaceholder: "Select a queue",
        noOptions: "No user found with that name",
        buttons: {
          ok: "Transfer",
          cancel: "Cancel"
        }
      },
      ticketsList: {
        media: {
          photo: "Photo",
          audio: "Audio",
          video: "Video",
          document: "Document",
          gif: "GIF",
          sticker: "Sticker"
        },
        pendingHeader: "Pending",
        assignedHeader: "Assigned",
        noTicketsTitle: "Nothing here!",
        noTicketsMessage: "No ticket found with this status or searched term",
        buttons: {
          accept: "Accept"
        }
      },
      newTicketModal: {
        title: "Create Ticket",
        fieldLabel: "Type to search for contact",
        add: "Add",
        buttons: {
          ok: "Save",
          cancel: "Cancel"
        }
      },
      mainDrawer: {
        sections: {
          service: "Service",
          audience: "Contacts",
          management: "Management",
          system: "System"
        },
        listItems: {
          dashboard: "Dashboard",
          connections: "Inbox",
          tickets: "Tickets",
          quickMessages: "Quick Responses",
          contacts: "Contacts",
          queues: "Queues & Chatbot",
          tags: "Tags",
          administration: "Administration",
          service: "Service",
          users: "Users",
          settings: "Settings",
          helps: "Help",
          messagesAPI: "API",
          schedules: "Schedules",
          campaigns: "Campaigns",
          annoucements: "Announcements",
          chats: "Internal Chat",
          chatsShort: "Chat",
          ticketsShort: "Tickets",
          search: "Search",
          online: "Online",
          noResults: "Nothing found",
          financeiro: "Financial",
          logout: "Logout",
          management: "Management",
          kanban: "Kanban",
          tasks: "Tasks",
          more: "More",
          menu: "Menu"
        },
        appBar: {
          i18n: {
            language: "English",
            language_short: "EN"
          },
          user: {
            profile: "Profile",
            subscriptionValidUntilLabel: "Subscription valid until",
            darkmode: "Dark mode",
            lightmode: "Light mode",
            language: "Select language",
            logout: "Logout"
          }
        }
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Number",
          body: "Message",
          token: "Registered Token"
        },
        mediaMessage: {
          number: "Number",
          body: "File Name",
          media: "File",
          token: "Registered Token"
        }
      },
      notifications: {
        noTickets: "No notifications.",
        volume: "Notification volume"
      },
      quickMessages: {
        title: "Quick Responses",
        buttons: {
          add: "New Response"
        },
        dialog: {
          shortcode: "Shortcut",
          message: "Response"
        }
      },
      kanban: {
        title: "Kanban",
        subtitle:
          "Drag contacts between columns to follow each stage of the conversation.",
        inbox: "Open",
        newLane: "New column",
        editLane: "Edit column",
        deleteLane: "Delete column",
        deleteLaneTitle: "Delete the column",
        deleteLaneMessage:
          "Tickets in this column go back to Open. No ticket is deleted.",
        moveTo: "Move to",
        moveLeft: "Move left",
        moveRight: "Move right",
        openConversation: "Open conversation",
        emptyLane: "Drag tickets here",
        noLanesTitle: "Build your board",
        noLanesDescription:
          "Create columns with a name and color to organize tickets by stage: new, negotiating, paid…",
        unassigned: "Unassigned",
        moved: "Ticket moved",
        ticketsCount: "tickets",
        searchPlaceholder: "Search",
        subMenus: {
          list: "Panel",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Open",
        confirmationModal: {
          deleteTitle: "Are you sure you want to delete this Lane?",
          deleteMessage: "This action cannot be undone."
        },
        table: {
          name: "Name",
          color: "Color",
          tickets: "Tickets",
          actions: "Actions"
        },
        buttons: {
          add: "New Lane"
        },
        toasts: {
          deleted: "Lane deleted successfully."
        }
      },
      contactLists: {
        title: "Contact Lists",
        table: {
          name: "Name",
          contacts: "Contacts",
          actions: "Actions"
        },
        buttons: {
          add: "New List"
        },
        dialog: {
          name: "Name",
          company: "Company",
          okEdit: "Edit",
          okAdd: "Add",
          add: "Add",
          edit: "Edit",
          cancel: "Cancel"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone."
        },
        toasts: {
          deleted: "Record deleted",
          created: "Record created"
        }
      },
      contactListItems: {
        title: "Contacts",
        searchPlaceholder: "Search",
        buttons: {
          add: "New",
          lists: "Lists",
          import: "Import"
        },
        dialog: {
          name: "Name",
          number: "Number",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Edit",
          okAdd: "Add",
          add: "Add",
          edit: "Edit",
          cancel: "Cancel"
        },
        table: {
          name: "Name",
          number: "Number",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone.",
          importMessage:
            "Do you want to import the contacts from this spreadsheet? ",
          importTitlte: "Import"
        },
        toasts: {
          deleted: "Record deleted"
        }
      },
      campaigns: {
        title: "Campaigns",
        searchPlaceholder: "Search",
        buttons: {
          add: "New Campaign",
          contactLists: "Contact Lists"
        },
        table: {
          name: "Name",
          whatsapp: "Connection",
          contactList: "Contact List",
          status: "Status",
          scheduledAt: "Scheduled",
          completedAt: "Completed",
          confirmation: "Confirmation",
          actions: "Actions"
        },
        dialog: {
          new: "New Campaign",
          update: "Edit Campaign",
          readonly: "Read-only",
          form: {
            name: "Name",
            message1: "Message 1",
            message2: "Message 2",
            message3: "Message 3",
            message4: "Message 4",
            message5: "Message 5",
            confirmationMessage1: "Confirmation Message 1",
            confirmationMessage2: "Confirmation Message 2",
            confirmationMessage3: "Confirmation Message 3",
            confirmationMessage4: "Confirmation Message 4",
            confirmationMessage5: "Confirmation Message 5",
            messagePlaceholder: "Message content",
            whatsapp: "Connection",
            status: "Status",
            scheduledAt: "Scheduled",
            confirmation: "Confirmation",
            contactList: "Contact List"
          },
          buttons: {
            add: "Add",
            edit: "Update",
            okadd: "Ok",
            cancel: "Cancel Dispatches",
            restart: "Restart Dispatches",
            close: "Close",
            attach: "Attach File"
          }
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone."
        },
        toasts: {
          success: "Operation completed successfully",
          cancel: "Campaign canceled",
          restart: "Campaign restarted",
          deleted: "Record deleted"
        }
      },
      announcements: {
        title: "Announcements",
        searchPlaceholder: "Search",
        buttons: {
          add: "New Announcement",
          contactLists: "Announcement Lists"
        },
        table: {
          priority: "Priority",
          title: "Title",
          text: "Text",
          mediaName: "File",
          status: "Status",
          actions: "Actions"
        },
        dialog: {
          edit: "Announcement Edit",
          add: "New Announcement",
          update: "Edit Announcement",
          readonly: "Read-only",
          form: {
            priority: "Priority",
            title: "Title",
            text: "Text",
            mediaPath: "File",
            status: "Status"
          },
          buttons: {
            add: "Add",
            edit: "Update",
            okadd: "Ok",
            cancel: "Cancel",
            close: "Close",
            attach: "Attach File"
          }
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone."
        },
        toasts: {
          success: "Operation completed successfully",
          deleted: "Record deleted"
        }
      },
      campaignsConfig: {
        title: "Campaign Configurations",
        intervals: "Intervals",
        messageInterval: "Message Interval (seconds)",
        longerIntervalAfter: "Longer Interval After (messages)",
        longerInterval: "Longer Interval (seconds)",
        addVariable: "Add Variable"
      },
      queues: {
        title: "Queues & Chatbot",
        table: {
          name: "Name",
          color: "Color",
          greeting: "Greeting Message",
          actions: "Actions"
        },
        toasts: {
          deleted: "Queue removed successfully"
        },
        buttons: {
          add: "Add Queue"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage:
            "Are you sure? This action cannot be undone! The tickets from this queue will still exist but will no longer be assigned to any queue."
        }
      },
      queueSelect: {
        inputLabel: "Queues"
      },
      users: {
        title: "Users",
        table: {
          name: "Name",
          email: "Email",
          profile: "Profile",
          actions: "Actions"
        },
        buttons: {
          add: "Add User"
        },
        toasts: {
          deleted: "User deleted successfully."
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage:
            "All user data will be lost. Open tickets from this user will be moved to the queue."
        }
      },
      helps: {
        title: "Help Center"
      },
      notificationSound: {
        title: "Notification sound",
        description:
          "Plays a sound when a new message arrives. Applies to this device only.",
        on: "on",
        off: "off"
      },
      push: {
        title: "Notifications on this device",
        description:
          "Get new messages with the contact's name and photo, even with the app closed.",
        activeDescription:
          "You get new messages with the contact's name and photo, even with the app closed.",
        enable: "Turn on",
        enabled: "On",
        enableOnPhone: "Turn on notifications",
        enabledToast: "Notifications turned on for this device",
        blocked:
          "Notifications are blocked. Allow them in your browser or phone settings.",
        failed: "Couldn't turn on notifications right now. Please try again.",
        unsupported: "This browser doesn't support push notifications.",
        iosHint:
          "On iPhone, add the app to your Home Screen (Share > Add to Home Screen) and open it from there to turn this on."
      },
      quickReplies: {
        title: "Quick replies",
        search: "Search by shortcut or text",
        empty:
          "No quick replies yet. Create the first one to use in conversations.",
        emptySearch: "No replies found.",
        use: "Use this reply",
        edit: "Edit",
        delete: "Delete",
        deleteTitle: "Delete quick reply?",
        deleteMessage:
          "It will no longer be available to the team. This can't be undone.",
        add: "New reply",
        close: "Close",
        added: "Quick reply created",
        updated: "Quick reply updated",
        deleted: "Quick reply deleted"
      },
      ticketActions: {
        spy: "Peek conversation",
        close: "Close conversation",
        noQueue: "No queue"
      },
      expressions: {
        searchEmoji: "Search emoji",
        recent: "Recent",
        frequent: "Most used",
        emojiResults: "Results",
        noEmoji: "No emoji found",
        emojiCategories: {
          people: "Smileys & people",
          nature: "Animals & nature",
          foods: "Food & drink",
          activity: "Activities",
          places: "Travel & places",
          objects: "Objects",
          symbols: "Symbols",
          flags: "Flags"
        },
        title: "Emoji, stickers and GIFs",
        emoji: "Emoji",
        stickers: "Stickers",
        gifs: "GIFs",
        searchStickers: "Search stickers",
        searchGifs: "Search GIFs",
        noStickers:
          "Stickers that arrive in conversations show up here so you can send them again.",
        noGifs: "No GIFs found.",
        gifsNotConfigured:
          "GIFs are not set up yet: the system administrator adds the KLIPY key in Settings > Options > Integrations.",
        sendSticker: "Send sticker",
        sendGif: "Send GIF"
      },
      about: {
        headline: "Built to help you serve better, every day",
        product:
          "vuup.me is a WhatsApp customer service platform that brings your team together in one place: conversations, queues, chatbot, Kanban and internal chat.",
        founder:
          "I'm David Fernandes, I'm 22 years old and I'm an entrepreneur in the technology field.",
        improving:
          "I'm always improving vuup.me: every update brings fixes and new features to make the day-to-day of whoever handles support simpler.",
        founderRole: "Founder of vuup.me",
        license: "Free software under the AGPL-3.0 license.",
        sourceCode: "Source code",
        aboutthe: "About the",
        copyright: "© 2024 - Powered by vuup.me",
        buttonclose: "Close",
        title: "About vuup.me",
        abouttitle: "Origin and improvements",
        aboutdetail:
          "vuup.me is indirectly derived from the Whaticket project with improvements shared by the developers of the EquipeChat system through the VemFazer channel on YouTube, later improved by Claudemir Todo Bom",
        aboutauthorsite: "Author's site",
        aboutwhaticketsite: "Whaticket Community site on Github",
        aboutvemfazersite: "Vem Fazer channel site on Github",
        licenseheading: "Open Source License",
        licensedetail:
          "vuup.me is licensed under the GNU Affero General Public License version 3, which means that any user who has access to this application has the right to obtain access to the source code. More information at the links below:",
        licensefulltext: "Full text of the license",
        licensesourcecode: "vuup.me source code"
      },
      schedules: {
        calendar: {
          subtitle: "See on the calendar when each message will be sent.",
          today: "Today",
          list: "List",
          month: "Month",
          all: "All",
          pending: "Scheduled",
          sent: "Sent",
          error: "Failed",
          more: "more",
          noEvents: "No schedules this month.",
          noEventsDay: "Nothing scheduled this day",
          scheduleThisDay: "Schedule on this day",
          previous: "Previous month",
          next: "Next month",
          count: "{{count}} schedule",
          count_plural: "{{count}} schedules"
        },
        title: "Schedules",
        confirmationModal: {
          deleteTitle: "Are you sure you want to delete this Schedule?",
          deleteMessage: "This action cannot be undone."
        },
        table: {
          contact: "Contact",
          body: "Message",
          sendAt: "Scheduling Date",
          sentAt: "Sending Date",
          status: "Status",
          actions: "Actions"
        },
        buttons: {
          add: "New Schedule"
        },
        toasts: {
          deleted: "Schedule deleted successfully."
        }
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Are you sure you want to delete this Tag?",
          deleteMessage: "This action cannot be undone."
        },
        table: {
          name: "Name",
          color: "Color",
          tickets: "Tickets",
          contacts: "Contacts",
          actions: "Actions",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "New Tag"
        },
        toasts: {
          deleted: "Tag deleted successfully."
        }
      },
      whitelabel: {
        primaryColorLight: "Primary color light",
        primaryColorDark: "Primary color dark",
        lightLogo: "App logo light",
        darkLogo: "App logo dark",
        favicon: "App logo favicon",
        appname: "App name",
        logoHint: "Prefer SVG and aspect of 28:10",
        faviconHint: "Prefer square SVG image or 512x512 PNG",
        loginLinks: "Login links",
        loginLinksHint:
          "Add title and URL pairs to display below the login box on desktop and mobile.",
        linkTitle: "Link title",
        linkUrl: "Link URL",
        removeLink: "Remove link",
        sidePanelImage: "Login side panel image",
        sidePanelImageHint:
          "Displayed on the left side of the login form on desktop layouts.",
        backgroundContent: "Login background content",
        backgroundContentHint:
          "Supports images, SVG files, and MP4 videos for the login screen background.",
        noFileSelected: "No file selected yet.",
        buildExtension: "Build WA Session Capture extension",
        buildingExtension: "Building extension…",
        downloadExtension: "Download extension",
        extensionHint:
          "Builds a whitelabeled Chrome extension. The downloaded ZIP already contains the extension files: extract it and load the extracted folder as an unpacked extension.",
        extensionBuildStarted:
          "Extension build started. You will be notified when it is ready.",
        extensionBuildFailed: "Could not start the extension build.",
        extensionBuilt: "Extension built successfully.",
        extensionBuildUnknownError: "Unknown build error."
      },
      settings: {
        options: {
          nav: "Option sections",
          sections: {
            service: {
              title: "Service",
              description:
                "Automatic messages and what happens when a conversation is accepted, transferred, closed or reopened."
            },
            automation: {
              title: "Chatbot and automations",
              description:
                "The automatic menu that greets the customer and what the system does on its own with idle conversations."
            },
            hours: {
              title: "Business hours",
              description:
                "When the company is open and what to do with messages that arrive outside those hours."
            },
            chat: {
              title: "Conversations",
              description:
                "What the team sees and uses on the conversation screen: history, quick replies, calls and groups."
            },
            ai: {
              title: "Artificial intelligence",
              description:
                "Providers and keys for audio transcription and for the queues' AI assistant."
            },
            integrations: {
              title: "Integrations",
              description:
                "Keys that let other systems and services work together with vuup.me."
            },
            files: {
              title: "Files",
              description:
                "Maximum size of the files sent and received through the connections. Applies to every company."
            },
            system: {
              title: "System",
              description:
                "Options for the whole installation. They apply to every company."
            }
          },
          groups: {
            autoMessages: "Automatic messages",
            closing: "Closing",
            rating: "Satisfaction survey",
            tags: "Tags",
            chatbot: "Chatbot",
            idle: "Idle conversations",
            idleHint:
              "Choose after how long the system acts on its own. Leave 0 to do nothing.",
            chatScreen: "Conversation screen",
            calls: "Calls",
            groups: "WhatsApp groups",
            transcription: "Audio transcription",
            agent: "Queues' AI assistant",
            agentHint:
              "Used by queues with the AI Assistant turned on (Queues & Chatbot › edit queue), by the smart reception and by the in-conversation assistant. It is separate from the transcription key.",
            api: "API",
            media: "GIFs and stickers",
            limits: "Size limits",
            access: "Language, sign-up and billing",
            server: "Server"
          },
          units: {
            minutes: "min",
            days: "days",
            megabytes: "MB"
          },
          timeout: {
            after: "After",
            then: "The system will",
            close: "Close the conversation",
            transferTo: "Send it to the {{queue}} queue"
          },
          variables: {
            title: "You can use:",
            firstname: "customer's first name",
            name: "full name",
            greeting: "good morning, afternoon or evening",
            user: "agent's name",
            queue: "queue name",
            protocol: "protocol number"
          },
          notes: {
            needsRating: "Turn on the rating request to use this.",
            needsSchedule: "Turn on business hours to use this.",
            groupsIgnored: "Available when group messages are not ignored.",
            scheduleCompany:
              "The hours are set in the Schedules tab, here in Settings.",
            scheduleQueue:
              "Each queue's hours are set in Queues & Chatbot, when editing the queue."
          },
          apiToken: {
            generate: "Generate token",
            copy: "Copy",
            remove: "Delete",
            empty: "No token generated"
          },
          fields: {
            ticketAcceptedMessage: {
              title: "When the conversation is accepted",
              description:
                "Sent to the customer when an agent takes over the conversation. Leave it blank to send nothing.",
              placeholder:
                "E.g.: {{greeting}}, {{firstname}}! This is {{user}}, I'll take it from here."
            },
            transferMessage: {
              title: "When transferred to another queue",
              description:
                "Sent to the customer when the conversation changes queue. If the connection has its own transfer message, that one is used. Leave it blank to send nothing.",
              placeholder:
                "E.g.: {{firstname}}, I'm handing you over to the {{queue}} team. Someone will reply shortly!"
            },
            keepUserAndQueue: {
              title: "Keep queue and agent when closing",
              description:
                "On: the closed conversation keeps its queue and agent, and goes back to them if it is reopened. Off: both are removed when it is closed."
            },
            autoReopenTimeout: {
              title: "Reopen recent conversation",
              description:
                "If the customer writes again within this time after closing, the same conversation is reopened instead of starting a new one. 0 turns it off."
            },
            userRating: {
              title: "Ask for a rating when closing",
              description:
                "When the conversation is closed, the customer is asked to rate the service from 1 to 5."
            },
            ratingsTimeout: {
              title: "Time to rate",
              description:
                "How long the customer has to send the rating. After that, the request expires and they get the closing message."
            },
            tagsMode: {
              title: "Where tags are kept",
              description:
                "In the conversation: they only apply to that service. In the contact: they follow the person across all conversations. Both: they go to the conversation and to the contact.",
              options: {
                ticket: "In the conversation",
                contact: "In the contact",
                both: "Both"
              }
            },
            chatbotAutoExit: {
              title: "Leave the chatbot on an off-menu reply",
              description:
                "On: if the customer writes something that is not an option, the conversation leaves the chatbot and goes to an agent. Off: the menu is sent again."
            },
            showNumericIcons: {
              title: "Emoji numbers in the menu",
              description:
                "Shows the chatbot options as 1️⃣ 2️⃣ 3️⃣ instead of 1, 2, 3."
            },
            chatbotTicketTimeout: {
              title: "Customer stopped answering the chatbot",
              description:
                "The conversation is still in the automatic menu and the customer has not replied anymore."
            },
            noQueueTimeout: {
              title: "Conversation waiting without a queue",
              description:
                "The conversation arrived but has not entered any queue yet."
            },
            openTicketTimeout: {
              title: "Idle conversation in service",
              description:
                "An agent took over the conversation, but nobody wrote anything during this time."
            },
            openTicketTimeoutAction: {
              options: {
                pending: "Return it to the queue",
                closed: "Close the conversation"
              }
            },
            scheduleType: {
              title: "Business hours control",
              description:
                "Outside business hours, the customer gets the away message and the conversation follows the rule below.",
              options: {
                disabled: "Off",
                company: "One schedule for the whole company",
                queue: "One schedule per queue"
              }
            },
            outOfHoursAction: {
              title: "Messages outside business hours",
              description:
                "After the away message, the conversation waits in the queue until someone answers, or is closed right away.",
              options: {
                pending: "Wait in the queue",
                closed: "Are closed"
              }
            },
            messageVisibility: {
              title: "History the agent sees",
              description:
                "For conversations that went through more than one queue: the agent sees only what was said in their queues, or the whole conversation.",
              options: {
                message: "Only their queues",
                ticket: "The whole conversation"
              }
            },
            quickMessages: {
              title: "Quick replies",
              description:
                "Shared: everyone sees and uses the same ones. Per user: each person only sees the ones they created.",
              options: {
                individual: "Each user has their own",
                company: "Shared"
              }
            },
            call: {
              title: "WhatsApp calls",
              description:
                "The system does not answer voice or video calls. Choose whether the customer gets an automatic message asking them to write instead.",
              options: {
                enabled: "Just ignore",
                disabled: "Let the customer know"
              }
            },
            CheckMsgIsGroup: {
              title: "Ignore group messages",
              description:
                "On: messages from WhatsApp groups do not become conversations in the system. Off: each group becomes a conversation."
            },
            groupsTab: {
              title: "Separate tab for groups",
              description:
                "Shows group conversations in their own tab, away from customer conversations."
            },
            soundGroupNotifications: {
              title: "Group message alerts",
              description:
                "Also plays the sound and shows a notification when a group message arrives."
            },
            audioTranscriptions: {
              title: "Transcribe audio",
              description:
                "Shows the “transcribe” button on audio messages. The audio is only sent to the AI when someone clicks it."
            },
            aiProvider: {
              title: "Provider",
              description: "Service that turns the audio into text.",
              options: {
                openai: "OpenAI",
                groq: "Groq"
              }
            },
            openAiKey: {
              title: "Access key",
              description:
                "API key of the provider chosen above. OpenAI: platform.openai.com › API keys. Groq: console.groq.com › API Keys."
            },
            aiAgentProvider: {
              title: "Provider",
              description:
                "AI service that talks to customers and suggests replies to the team.",
              options: {
                openai: "OpenAI",
                gemini: "Google Gemini",
                groq: "Groq"
              }
            },
            aiAgentApiKey: {
              title: "Access key",
              description: "API key of the provider chosen above."
            },
            aiAgentModel: {
              title: "Model",
              description:
                "Optional. When blank, the model shown in the field is used."
            },
            apiToken: {
              title: "API token",
              description:
                "Key other systems use to create, read, update and delete contacts through the API. Whoever has the token has that access: keep it somewhere safe and delete it if it leaks."
            },
            klipyApiKey: {
              title: "KLIPY key",
              description:
                "Free key from klipy.com (the GIF and sticker library used by Discord). With it, the chat's GIF and sticker search uses KLIPY; without it, GIPHY. Applies to every company."
            },
            uploadLimit: {
              title: "Sending limit",
              description:
                "Files larger than this are not sent as attachments: the customer gets a download link instead. When blank, 15 MB."
            },
            downloadLimit: {
              title: "Receiving limit",
              description:
                "Received files larger than this are not downloaded, and the customer gets an automatic notice with the limit. When blank, 15 MB."
            },
            defaultLanguage: {
              title: "Default language",
              description:
                "Language of the automatic messages when the contact, the connection and the company have no language set."
            },
            allowSignup: {
              title: "New company sign-up",
              description:
                "Keeps the sign-up page open so new companies can create an account on their own."
            },
            gracePeriod: {
              title: "Grace period after due date",
              description:
                "How many days a company with an overdue payment can still use the system before being blocked."
            },
            useMultiThreadedWbot: {
              title: "Connections in separate threads",
              description:
                "Runs each WhatsApp connection in its own thread. Helps servers with many connections. Takes effect after the next restart."
            },
            extension: {
              title: "WhatsApp Web capture extension",
              description:
                "Builds a Chrome extension with your brand to connect numbers through WhatsApp Web. Extract the ZIP and load the folder in Chrome as an unpacked extension."
            },
            restart: {
              title: "Restart the server",
              description:
                "Restarts the backend. Connections drop for a few moments and come back on their own; this screen reloads right after."
            }
          }
        },
        saving: "Saving…",
        appearance: {
          tab: "Appearance",
          title: "Color theme",
          subtitle:
            "Choose the system colors for your whole team. The change shows up instantly on everyone's screen.",
          mode: "Mode",
          light: "Light",
          dark: "Dark",
          custom: "Custom",
          customDescription: "Use your brand color",
          restore: "Restore default",
          applied: "Theme applied",
          restored: "Default colors restored",
          current: "In use",
          presets: {
            tekvosoft: {
              name: "Black and white",
              description: "The default vuup.me identity: clean and neutral"
            },
            brandPurple: {
              name: "Purple",
              description: "Vibrant, modern violet"
            },
            classicBlue: {
              name: "Classic Blue",
              description: "Professional, sober and trustworthy blue"
            },
            forestGreen: {
              name: "Forest Green",
              description: "Nature-inspired green for a calm look"
            },
            oceanTeal: {
              name: "Ocean Teal",
              description: "Refreshing teal inspired by the sea"
            },
            sunsetOrange: {
              name: "Sunset Orange",
              description: "Warm orange and amber tones"
            },
            nightPurple: {
              name: "Night Purple",
              description: "Deep, elegant purple"
            },
            roseRed: {
              name: "Rosé",
              description: "Bold pink for a sophisticated look"
            },
            cosmic: {
              name: "Cosmic",
              description: "Indigo inspired by deep space"
            }
          }
        },
        restartBackend: {
          button: "Restart Backend",
          restarting: "Restarting…",
          success: "Backend restart initiated.",
          error: "Failed to restart backend."
        },
        success: "Setting saved successfully.",
        copiedToClipboard: "Copied to clipboard",
        title: "Settings",
        WelcomeGreeting: {
          greetings: "Hello",
          welcome: "Welcome to",
          expirationTime: "Active until"
        },
        Options: {
          title: "Options"
        },
        Companies: {
          title: "Companies"
        },
        schedules: {
          title: "schedules",
          updateToNewFormat: "Update to new format"
        },
        Plans: {
          title: "Plans",
          public: "Public",
          usersLimit: "Users limit",
          connectionsLimit: "Connections limit",
          queuesLimit: "Queues limit",
          currencyCode: "Currency code (ISO 4217)"
        },
        Help: {
          title: "Help"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Pasarelas de pago"
        },
        i18nSettings: {
          title: "Translations"
        },
        docker: {
          title: "Docker Containers",
          description:
            "Manage the server containers: check for image updates, pull+restart or restart.",
          selfBadge: "this backend",
          notChecked: "Not checked",
          updateAvailable: "Update available",
          upToDate: "Up to date",
          unavailable: "Unavailable",
          unavailableMessage:
            "Docker service unavailable on this server. Check if the Docker socket is mounted in the backend container.",
          columns: {
            name: "Name",
            image: "Image",
            state: "State",
            created: "Created",
            update: "Update",
            actions: "Actions"
          },
          actions: {
            refreshList: "Refresh list",
            checkUpdates: "Check for updates",
            checkUpdate: "Check for update",
            updateBackendFrontend: "Update backend & frontend",
            updatingBackendFrontend: "Updating backend & frontend...",
            update: "Pull + restart",
            restart: "Restart"
          },
          toasts: {
            updateAvailable: "Update available for {{name}}",
            selfUpdate:
              "The backend is being updated and will restart. Wait a few moments and reload the page.",
            selfRestart:
              "The backend is restarting. Wait a few moments and reload the page.",
            restarted: "{{name}} restarted",
            noUpdates: "No updates available."
          },
          confirm: {
            updateTitle: "Update {{name}}",
            updateAllTitle: "Update backend & frontend",
            updateAllBody:
              "Backend and frontend containers will be updated (pull + recreate). The backend container will restart and the application will be unavailable for a few moments. Do you want to continue?",
            restartTitle: "Restart {{name}}",
            updateBody:
              'The image "{{image}}" will be pulled and the container will be recreated with the new version. Do you want to continue?',
            restartBody:
              'The container "{{name}}" will be restarted. Do you want to continue?',
            selfWarning:
              "This is the backend container: the application will be unavailable for a few moments."
          },
          dashboardBanner: {
            title: "Container updates available",
            description: "Backend and/or frontend image updates are available.",
            updateAll: "Update backend & frontend",
            updating: "Updating...",
            confirmBody:
              "Backend and frontend containers will be updated (pull + recreate). The backend container will restart and the application will be unavailable for about 1 minute. Do you want to continue?"
          }
        }
      },
      messagesList: {
        transcribe: {
          action: "transcribe",
          loading: "transcribing…"
        },
        history: {
          load: "Recover message history",
          more: "Load older messages",
          none: "No previous messages with this contact",
          ticket: "Previous ticket #{{id}}",
          current: "Start of this ticket"
        },
        reactions: {
          react: "React",
          copy: "Copy",
          copied: "Message copied",
          more: "More options",
          you: "You"
        },
        header: {
          assignedTo: "Assigned to:",
          tapForInfo: "Tap to see contact info",
          buttons: {
            return: "Return",
            resolve: "Resolve",
            reopen: "Reopen",
            accept: "Accept",
            call: "Call",
            endCall: "End Call"
          }
        },
        openPaymentLink: "Open payment link"
      },
      messagesInput: {
        linkPreview: {
          loading: "Loading link preview…",
          remove: "Send without preview"
        },
        phone: {
          attach: "Attach",
          camera: "Camera",
          gallery: "Photos & videos",
          document: "Document",
          quickReplies: "Quick replies",
          signature: "Signature",
          on: "On",
          off: "Off",
          recording: "Recording",
          discardAudio: "Delete audio",
          sendAudio: "Send audio"
        },
        placeholderOpen: "Type a message",
        placeholderClosed: "Reopen or accept this ticket to send a message.",
        signMessage: "Sign",
        replying: "Replying",
        editing: "Editing"
      },
      message: {
        edited: "Edited",
        forwarded: "Forwarded"
      },

      contactDrawer: {
        group: {
          header: "Group info",
          kind: "Group",
          members: "{{count}} member",
          members_plural: "{{count}} members",
          actionSearch: "Search",
          actionMembers: "Members",
          search: "Search members",
          you: "You",
          admin: "Group admin",
          showAll: "See all ({{count}})",
          showMore: "See more",
          readMore: "Read more",
          readLess: "Show less",
          noResults: "No members found",
          leave: "Exit group",
          leaveConfirmTitle: "Exit this group?",
          leaveConfirmText:
            "The connection leaves the group on WhatsApp and stops receiving its messages. To come back you'll need an invite link.",
          left: "You left the group",
          notMember: "This connection is no longer in this group.",
          join: "Join group",
          joinTitle: "Join with invite link",
          joinLink: "Invite link",
          joinHint: "Paste this group's invite link (chat.whatsapp.com/…).",
          joined: "Done! The connection is back in the group."
        },
        media: {
          title: "Media, links and docs",
          media: "Media",
          docs: "Docs",
          links: "Links",
          empty_media: "No photos or videos with this contact.",
          empty_docs: "No documents with this contact.",
          empty_links: "No links with this contact.",
          loadMore: "Load more"
        },
        phone: {
          edit: "Edit",
          call: "Call",
          copy: "Copy",
          copied: "Number copied",
          copyFailed: "Couldn't copy the number",
          schedule: "Schedule",
          notes: "Notes",
          email: "Email",
          tags: "Tags",
          none: "None",
          queue: "Queue",
          noQueue: "No queue",
          attendant: "Agent",
          unassigned: "Unassigned",
          connection: "Connection",
          ticket: "Ticket",
          status: {
            open: "In progress",
            pending: "Waiting",
            closed: "Resolved",
            group: "Group"
          }
        },
        header: "Contact Information",
        buttons: {
          edit: "Edit Contact"
        },
        extraInfo: "Other information"
      },
      ticketOptionsMenu: {
        schedule: "Schedule",
        delete: "Delete",
        transfer: "Transfer",
        appointmentsModal: {
          title: "Ticket Notes",
          textarea: "Note",
          placeholder: "Insert the information you want to record here"
        },
        confirmationModal: {
          title: "Delete contact ticket",
          message: "Attention! All messages related to the ticket will be lost."
        },
        buttons: {
          delete: "Delete",
          cancel: "Cancel"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancel"
        }
      },
      messageOptionsMenu: {
        delete: "Delete",
        edit: "Edit",
        forward: "Forward",
        history: "History",
        reply: "Reply",
        confirmationModal: {
          title: "Delete message?",
          message: "This action cannot be undone."
        }
      },
      messageHistoryModal: {
        close: "Close",
        title: "Message edit history"
      },
      presence: {
        unavailable: "Unavailable",
        available: "Available",
        composing: "Composing...",
        recording: "Recording...",
        paused: "Paused"
      },
      privacyModal: {
        success: "Privacy updated",
        title: "Edit Whatsapp Privacy",
        buttons: {
          cancel: "Cancel",
          okEdit: "Save"
        },
        form: {
          menu: {
            all: "All",
            none: "Nobody",
            contacts: "My contacts",
            contact_blacklist: "Selected contacts",
            match_last_seen: "Match Last Seen",
            known: "Known",
            disable: "Disabled",
            hrs24: "24 Hours",
            dias7: "7 Days",
            dias90: "90 Days"
          },
          readreceipts: "To update the Read Receipts privacy",
          profile: "To update the Profile Picture privacy",
          status: "To update the Messages privacy",
          online: "To update the Online privacy",
          last: "To update the LastSeen privacy",
          groupadd: "To update the Groups Add privacy",
          calladd: "To update the Call Add privacy",
          disappearing: "To update the Default Disappearing Mode"
        }
      },
      phoneNumberInput: {
        country: "Country",
        phoneNumber: "Phone Number",
        localNumber: "Local Number"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR: "Configuration error. Please contact support.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Clock out of sync. Please check the date and time settings of your device.",
        ERR_BACKEND_UNREACHABLE: "Backend unreachable. Please try again later.",
        ERR_BACKEND_NOT_READY:
          "Backend is starting up and not ready yet. Retrying automatically."
      },
      backendErrors: {
        ERR_CODE_NOT_SENT:
          "We couldn't send the code to your email. Please try again in a moment.",
        ERR_CODE_EXPIRED:
          "The code has expired. Log in again to get a new one.",
        ERR_CODE_INVALID: "Wrong code. Check your email and try again.",
        ERR_WAIT_TO_RESEND:
          "Wait a few seconds before requesting another code.",
        ERR_EMAIL_DISABLED:
          "Email sending is not configured. Contact the administrator.",
        ERR_RESET_LINK_EXPIRED:
          "This link has expired or was already used. Request a new one.",
        ERR_PASSWORD_TOO_SHORT: "The password must have at least 6 characters.",
        ERR_NOT_A_GROUP: "This conversation is not a group.",
        ERR_GROUP_LEAVE: "Couldn't leave the group right now. Try again.",
        ERR_INVALID_INVITE: "Invalid or expired invite link.",
        ERR_INVITE_OTHER_GROUP: "That link belongs to another group.",
        ERR_INVALID_ADDRESS: "Invalid address. Check the ZIP code and number.",
        ERR_TRANSCRIPTION_DISABLED:
          "Audio transcription is disabled or no AI key is configured.",
        ERR_TRANSCRIPTION_FAILED: "Could not transcribe the audio.",
        ERR_NOT_AUDIO: "This message is not an audio.",
        ERR_INTERNAL: "Internal server error. Please contact support.",
        ERR_UNAUTHORIZED: "You are not authorized to perform this action.",
        ERR_FORBIDDEN: "You do not have permission to access this resource.",
        ERR_CHECK_NUMBER: "Check the number and try again.",
        ERR_NO_OTHER_WHATSAPP: "There must be at least one default WhatsApp.",
        ERR_NO_DEF_WAPP_FOUND:
          "No default WhatsApp found. Check the connections page.",
        ERR_WAPP_NOT_INITIALIZED:
          "This WhatsApp session has not been initialized. Check the connections page.",
        ERR_WAPP_CHECK_CONTACT:
          "Could not check WhatsApp contact. Check the connections page.",
        ERR_WAPP_INVALID_CONTACT: "This is not a valid WhatsApp number.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Could not download media from WhatsApp. Check the connections page.",
        ERR_USER_INACTIVE:
          "Your access is disabled. Contact your company administrator.",
        ERR_INVALID_CREDENTIALS: "Authentication error. Please try again.",
        ERR_SENDING_WAPP_MSG:
          "Error sending WhatsApp message. Check the connections page.",
        ERR_DELETE_WAPP_MSG: "Could not delete WhatsApp message.",
        ERR_EDITING_WAPP_MSG: "Could not edit WhatsApp message.",
        ERR_OTHER_OPEN_TICKET:
          "There is already an open ticket for this contact.",
        ERR_SESSION_EXPIRED: "Session expired. Please log in.",
        ERR_USER_CREATION_DISABLED:
          "User creation has been disabled by the administrator.",
        ERR_NO_PERMISSION:
          "You do not have permission to access this resource.",
        ERR_TOO_MANY_ATTEMPTS:
          "Too many attempts. Please wait a few minutes and try again.",
        ERR_DUPLICATED_CONTACT: "A contact with this number already exists.",
        ERR_NO_SETTING_FOUND: "No setting found with this ID.",
        ERR_NO_CONTACT_FOUND: "No contact found with this ID.",
        ERR_NO_TICKET_FOUND: "No ticket found with this ID.",
        ERR_NO_USER_FOUND: "No user found with this ID.",
        ERR_NO_WAPP_FOUND: "No WhatsApp found with this ID.",
        ERR_CREATING_MESSAGE: "Error creating message in the database.",
        ERR_CREATING_TICKET: "Error creating ticket in the database.",
        ERR_FETCH_WAPP_MSG:
          "Error fetching message from WhatsApp, perhaps it is too old.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "This color is already in use, choose another.",
        ERR_WAPP_GREETING_REQUIRED:
          "Greeting message is mandatory when there is more than one queue.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Subscription check failed.",
        ERR_WAPP_NOT_FOUND: "Connection unavailable.",
        ERR_SUBSCRIPTION_EXPIRED: "Your subscription has expired.",
        ERR_UNKOWN: "Unknown error."
      },
      phoneCall: {
        hangup: "Hang up"
      },
      wavoipModal: {
        title: "Enter your Wavoip connection token",
        instructions:
          "By accessing the address below you can create an account with 50 free calls for testing"
      },
      openHours: {
        title: "Business Hours",
        timezone: {
          placeholder: "Select time zone",
          searchPlaceholder: "Type to search...",
          selected: "Selected time zone"
        },
        tabs: {
          weekly: "Weekly Hours",
          overrides: "Exceptions and Holidays"
        },
        weekly: {
          title: "Weekly Business Hours",
          description:
            "Configure regular business hours for each day of the week.",
          rule: "Rule",
          empty:
            "No hours set: the queue answers at any time and nobody gets an out-of-hours reply.",
          useDefault: "Use Monday to Friday, 9am to 6pm",
          days: "Days of the Week",
          hours: "Hours",
          closedMessage: "Closed (no hours defined)",
          addHour: "Add Hours",
          addRule: "Add New Weekly Rule",
          from: "From",
          to: "To",
          until: "to"
        },
        overrides: {
          title: "Exceptions and Holidays",
          description:
            "Configure specific dates with special hours or closures (holidays, events, etc.).",
          exception: "Exception",
          date: "Date",
          label: "Description",
          labelPlaceholder: "E.g.: Christmas, Carnival...",
          repeat: "Repeat",
          repeatNone: "Don't repeat",
          repeatYearly: "Yearly",
          closedDay: "Closed on this day",
          specialHours: "Special Hours",
          addHour: "Add Hours",
          addException: "Add Exception or Holiday",
          from: "From",
          to: "To",
          until: "to"
        },
        days: {
          mon: "Monday",
          tue: "Tuesday",
          wed: "Wednesday",
          thu: "Thursday",
          fri: "Friday",
          sat: "Saturday",
          sun: "Sunday"
        }
      }
    }
  }
};

export { messages };
