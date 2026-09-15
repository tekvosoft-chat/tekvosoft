const messages = {
  en: {
    translations: {
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
        connections: "Connections",
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
        text: "Tekvosoft is designed for portrait mode. Turn your device upright to continue."
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
        connections: "Connections",
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
        title: "Sign Up",
        toasts: {
          success: "User created successfully! Log in now!!!",
          fail: "Error creating user. Check the provided data."
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Password"
        },
        buttons: {
          submit: "Sign Up",
          login: "Already have an account? Log in!"
        }
      },
      login: {
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
        title: "Connections",
        toasts: {
          deleted: "WhatsApp connection successfully deleted!"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "Are you sure? This action cannot be undone.",
          disconnectTitle: "Disconnect",
          disconnectMessage:
            "Are you sure? You will need to scan the QR Code again.",
          closeTickets: "Close all open tickets from this connection"
        },
        buttons: {
          add: "Add WhatsApp",
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
        files: "files",
        remove: "Remove",
        send: "Send"
      },
      internalChat: {
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
          add: "Add WhatsApp",
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
          connections: "Connections",
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
        title: "Emoji, stickers and GIFs",
        emoji: "Emoji",
        stickers: "Stickers",
        gifs: "GIFs",
        searchGifs: "Search GIFs",
        noStickers:
          "Stickers that arrive in conversations show up here so you can send them again.",
        noGifs: "No GIFs found.",
        gifsNotConfigured:
          "To use GIFs, add your GIPHY key in Settings > Options > External services.",
        sendSticker: "Send sticker",
        sendGif: "Send GIF"
      },
      about: {
        headline: "Built to help you serve better, every day",
        product:
          "Tekvosoft is a WhatsApp customer service platform that brings your team together in one place: conversations, queues, chatbot, Kanban and internal chat.",
        founder:
          "I'm David Fernandes, I'm 22 years old and I'm an entrepreneur in the technology field.",
        improving:
          "I'm always improving Tekvosoft: every update brings fixes and new features to make the day-to-day of whoever handles support simpler.",
        founderRole: "Founder of Tekvosoft",
        license: "Free software under the AGPL-3.0 license.",
        sourceCode: "Source code",
        aboutthe: "About the",
        copyright: "© 2024 - Powered by Tekvosoft",
        buttonclose: "Close",
        title: "About Tekvosoft",
        abouttitle: "Origin and improvements",
        aboutdetail:
          "Tekvosoft is indirectly derived from the Whaticket project with improvements shared by the developers of the EquipeChat system through the VemFazer channel on YouTube, later improved by Claudemir Todo Bom",
        aboutauthorsite: "Author's site",
        aboutwhaticketsite: "Whaticket Community site on Github",
        aboutvemfazersite: "Vem Fazer channel site on Github",
        licenseheading: "Open Source License",
        licensedetail:
          "Tekvosoft is licensed under the GNU Affero General Public License version 3, which means that any user who has access to this application has the right to obtain access to the source code. More information at the links below:",
        licensefulltext: "Full text of the license",
        licensesourcecode: "Tekvosoft source code"
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
        giphyApiKey: {
          title: "GIPHY key (GIFs)"
        },
        hints: {
          giphyKey:
            "Free key created at developers.giphy.com. With it, the team can search and send GIFs in the chat.",
          groups: {
            general: "How service works day to day.",
            timeouts:
              "What the system does on its own when a conversation goes idle. Times in minutes; 0 turns it off.",
            officeHours:
              "Business hours and what happens to messages that arrive outside them.",
            groups: "How to handle WhatsApp group conversations.",
            confidenciality:
              "What each agent sees from other queues' conversations.",
            api: "Key for external systems to read contacts through the API.",
            externalServices:
              "Artificial intelligence to transcribe audio and the GIPHY key to send GIFs.",
            serveradmin:
              "Options for the whole installation: they apply to every company."
          },
          ratings:
            "When the conversation is closed, the customer is asked to rate the service.",
          calls:
            "When the customer calls on WhatsApp: ignore the call or reply saying calls aren't answered.",
          chatbotAutoExit:
            "If the customer types something that isn't a menu option, the conversation leaves the chatbot and goes to the queue.",
          quickMessages:
            "Quick replies shared with the whole company or kept per user.",
          tagsMode:
            "Where tags live: on the ticket (gone when it closes), on the contact (follow the person) or both.",
          numericIcons:
            "In the chatbot menu, show options as 1️⃣ 2️⃣ 3️⃣ instead of plain numbers.",
          ticketAccepted:
            "Sent to the customer when an agent accepts the conversation. Leave blank to send nothing.",
          transfer:
            "Sent to the customer when the conversation is transferred. Leave blank to send nothing.",
          ratingsTimeout:
            "How long the customer has to answer the rating. After that, the request expires.",
          autoReopen:
            "If the customer writes again within this time after closing, the same ticket is reopened. 0 turns it off.",
          noQueueTimeout:
            "Waiting conversations without a queue for longer than this get the action chosen next to it. 0 turns it off.",
          noQueueTimeoutAction:
            "What to do with an idle conversation without a queue: close it or send it to a queue.",
          openTicketTimeout:
            "Open conversations with no messages for this long get the action chosen next to it. 0 turns it off.",
          openTicketTimeoutAction:
            "What to do with an idle open conversation: return it to the queue or close it.",
          chatbotTimeout:
            "If the customer stops answering the chatbot for this long, the chosen action is applied. 0 turns it off.",
          chatbotTimeoutAction:
            "What to do when the customer abandons the chatbot: close it or send it to a queue.",
          officeHours:
            "Turns on business-hours control, with hours for the whole company or per queue.",
          outOfHours:
            "What happens to messages that arrive outside business hours: they wait or the ticket is closed.",
          ignoreGroups:
            "When on, messages from WhatsApp groups don't become tickets.",
          soundGroups: "Also play the notification sound for group messages.",
          groupsTab: "Show group conversations in their own tab under Tickets.",
          messageVisibility:
            "Respect message queue: agents only see messages exchanged in their queues. Respect ticket queue: they see the whole ticket history.",
          keepQueueAndUser:
            "When on, a closed ticket keeps its queue and agent. When off, both are removed on close.",
          apiToken:
            "Key used by external systems to read contacts through the API. Generate, copy and keep it safe.",
          aiProvider: "Artificial intelligence service that transcribes audio.",
          aiKey: "Access key for the service chosen next to it.",
          audioTranscriptions:
            "Turns received audio into text, shown next to the audio in the conversation.",
          allowSignup:
            "Lets new companies create an account on their own through the sign-up page.",
          multithread:
            "Runs WhatsApp connections in separate processes. Helps on servers with many connections.",
          uploadLimit: "Maximum size, in MB, of files the team sends.",
          downloadLimit:
            "Maximum size, in MB, of received files the system downloads. Above that, the customer is told.",
          gracePeriod:
            "How many days a company can still use the system after the due date before being blocked."
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
          applied: "Theme applied for the whole team",
          restored: "Default colors restored",
          current: "In use",
          presets: {
            tekvosoft: {
              name: "Tekvosoft Purple",
              description: "The default identity: vibrant, modern violet"
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
        group: {
          general: "General",
          timeouts: "Timeouts",
          officeHours: "Office Hours",
          groups: "Groups",
          confidenciality: "Confidentiality",
          api: "API",
          externalServices: "External Services",
          serveradmin: "Server Administration"
        },
        success: "Setting saved successfully.",
        copiedToClipboard: "Copied to clipboard",
        title: "Settings",
        chatbotTicketTimeout: "Chatbot ticket timeout (minutes)",
        chatbotTicketTimeoutAction: "Action after chatbot timeout",
        settings: {
          userCreation: {
            name: "User creation",
            options: {
              enabled: "Enabled",
              disabled: "Disabled"
            }
          }
        },
        validations: {
          title: "validations",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        OfficeManagement: {
          title: "Office Management",
          options: {
            disabled: "disabled",
            ManagementByDepartment: "Management By Department",
            ManagementByCompany: "Management By Company"
          }
        },
        outOfHoursAction: {
          title: "Out of Hours Action",
          options: {
            pending: "Leave as pending",
            closed: "Close ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignore Group Messages",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        soundGroupNotifications: {
          title: "Sound on Group Notifications",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        groupsTab: {
          title: "Groups Tab",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        VoiceAndVideoCalls: {
          title: "Voice and video calls",
          options: {
            enabled: "Ignore",
            disabled: "unavailability report"
          }
        },
        AutomaticChatbotOutput: {
          title: "Automatic Chatbot Output",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        ShowNumericEmoticons: {
          title: "Display numeric emojis in the queue",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        QuickMessages: {
          title: "Quick Messages",
          options: {
            enabled: "By company",
            disabled: "By User"
          }
        },
        AllowRegistration: {
          title: "Allow Registration",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        MultiThreadedWbot: {
          title: "Multithreaded WhatsApp Worker",
          options: {
            enabled: "Enabled",
            disabled: "Disabled"
          }
        },
        FileUploadLimit: {
          title: "File Upload Limit (MB)"
        },
        FileDownloadLimit: {
          title: "File Download Limit (MB)"
        },
        messageVisibility: {
          title: "Message Visibility",
          options: {
            respectMessageQueue: "Respect queue of message",
            respectTicketQueue: "Respect queue of ticket"
          }
        },
        keepQueueAndUser: {
          title: "Keep queue and user on closed ticket",
          options: {
            enabled: "Enabled",
            disabled: "Disabled"
          }
        },
        GracePeriod: {
          title: "Subscription Grace Period (days)"
        },
        ticketAcceptedMessage: {
          title: "Ticket Accepted Message",
          placeholder: "Enter your ticket accepted message here"
        },
        transferMessage: {
          title: "Transfer Message",
          placeholder: "Enter your transfer message here"
        },
        mustacheVariables: {
          title: "Available variables:"
        },
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
        AIProvider: {
          title: "AI Provider"
        },
        AudioTranscriptions: {
          title: "Audio Transcriptions"
        },
        TagsMode: {
          title: "Tags Mode",
          options: {
            ticket: "Ticket",
            contact: "Contact",
            both: "Ticket and Contact"
          }
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
