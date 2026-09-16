const messages = {
  es: {
    translations: {
      paywall: {
        title: "¡Ups! Tu acceso expiró",
        voluntaryTitle: "Elige tu plan",
        adminText:
          "El período terminó y nosotros también tenemos cuentas que pagar 😅 Elige un plan y libera el sistema ahora mismo — 30 días desde la fecha de pago.",
        voluntaryText: "Paga ahora y obtén 30 días desde la fecha de pago.",
        userText:
          "El acceso de tu empresa está suspendido. Pide al administrador que renueve la suscripción.",
        perMonth: "/mes",
        users: "Hasta {{count}} usuarios",
        connections: "{{count}} conexiones",
        queues: "{{count}} colas",
        pay: "Pagar {{value}}",
        logout: "Salir",
        later: "Ahora no",
        thanksTitle: "¡Pago confirmado!",
        thanksText:
          "Muchas gracias por confiar en nosotros. Tu acceso fue liberado por 30 días más.",
        continue: "Continuar"
      },
      payment: {
        title: "Pago de la suscripción",
        pix: "Pix",
        card: "Tarjeta",
        boleto: "Boleto",
        payNow: "Pagar ahora",
        processing: "Procesando…",
        paid: "¡Pago aprobado!",
        copied: "Copiado",
        copyCode: "Copiar código Pix",
        copyLine: "Copiar línea",
        openBoleto: "Abrir boleto",
        pixIntro:
          "Generamos un código QR de Pix. El pago se acredita al instante.",
        pixHint:
          "Abre la app del banco, elige Pix > Leer QR y apunta a la imagen.",
        boletoIntro:
          "Generamos el boleto en PDF con la línea digitable. La acreditación tarda hasta 3 días hábiles.",
        boletoHint: "El boleto también fue enviado al correo de la empresa.",
        cardIntro:
          "Cobro inmediato. Puedes guardar la tarjeta para que los próximos meses se cobren solos.",
        cardApproved: "¡Tarjeta aprobada! Tu suscripción está al día.",
        cardPending:
          "Cobro enviado. Cuando el banco confirme, tu suscripción se renueva.",
        cardSaved: "Tarjeta guardada: {{card}}",
        saveCard: "Guardar tarjeta para cobro automático",
        saveCardHint:
          "Guardamos solo un código seguro (token), nunca el número.",
        autoCharge: "Cobro automático activo · {{card}}",
        removeCard: "Quitar tarjeta guardada",
        cardRemoved: "Tarjeta eliminada",
        noMethods: "No hay forma de pago activa. Habla con el soporte.",
        form: {
          holder: "Nombre en la tarjeta",
          number: "Número de la tarjeta",
          expiry: "Vencimiento (MM/AAAA)",
          ccv: "CVV",
          cpfCnpj: "CPF o CNPJ",
          email: "Correo",
          phone: "Celular",
          postalCode: "Código postal",
          addressNumber: "Número"
        }
      },
      paymentGateways: {
        intro:
          "Elige qué puede usar el cliente para pagar. Lo que esté apagado no aparece.",
        pix: {
          title: "Pix",
          provider: "Efí (Gerencianet)",
          how: "El cliente lee un QR y el dinero llega al instante a tu cuenta Efí.",
          steps: [
            "Crea una aplicación Pix en Efí y genera el certificado (.p12).",
            "Completa abajo el Client ID, el Client Secret, la clave Pix y sube el certificado.",
            "El sistema registra solo el aviso de pago (webhook) en Efí.",
            "Al pagar, la factura se salda y el vencimiento de la empresa avanza."
          ]
        },
        card: {
          title: "Tarjeta de crédito",
          provider: "Asaas",
          how: "Cobro inmediato. Con la tarjeta guardada, los meses siguientes se cobran solos.",
          steps: [
            "Crea la cuenta en Asaas y genera la clave de API (Integraciones > API).",
            "Pega la clave abajo y elige Sandbox (pruebas) o Producción.",
            "Registra la URL de aviso en Asaas (Integraciones > Webhooks) con el mismo token.",
            "Pide a Asaas habilitar la tokenización de tarjeta para el cobro automático en producción.",
            "Todos los días a las 9h el sistema cobra en la tarjeta guardada las facturas que vencen."
          ]
        },
        boleto: {
          title: "Boleto bancario",
          provider: "Asaas",
          how: "Genera el boleto en PDF con línea digitable; la acreditación tarda hasta 3 días hábiles.",
          steps: [
            "Usa la misma cuenta y clave de Asaas de la tarjeta.",
            "El cliente recibe el boleto en pantalla y por correo.",
            "Cuando el banco confirma, Asaas avisa por webhook y la factura se salda sola."
          ]
        },
        asaas: {
          key: "Clave de API de Asaas",
          env: "Entorno",
          sandbox: "Sandbox (pruebas)",
          production: "Producción",
          webhookToken: "Token del webhook",
          webhookUrl: "Registra esta URL en Asaas (Integraciones > Webhooks):"
        }
      },
      revenue: {
        monthly: "Ingreso mensual",
        monthlySub: "{{count}} cliente activo",
        monthlySub_plural: "{{count}} clientes activos",
        next30: "A recibir en 30 días",
        next30Sub: "Vencimientos del próximo mes",
        overdue: "Atrasado",
        overdueSub: "{{count}} cliente",
        overdueSub_plural: "{{count}} clientes",
        autoCharge: "Cobro automático",
        autoChargeSub: "Clientes con tarjeta guardada",
        forecast: "Previsión de los próximos 6 meses",
        expected: "Previsto",
        clients: "Clientes",
        search: "Buscar cliente",
        empty: "Ningún cliente con cobro configurado.",
        value: "Valor",
        nextDue: "Próximo vencimiento",
        status: "Situación",
        charge: "Cobro",
        noPlan: "Sin plan",
        noDate: "Sin vencimiento",
        today: "Vence hoy",
        inDays: "En {{count}} día",
        inDays_plural: "En {{count}} días",
        lateBy: "Atrasado {{count}} día",
        lateBy_plural: "Atrasado {{count}} días",
        auto: "Automático",
        manualCharge: "Manual",
        recurrence: {
          MENSAL: "Mensual",
          BIMESTRAL: "Bimestral",
          TRIMESTRAL: "Trimestral",
          SEMESTRAL: "Semestral",
          ANUAL: "Anual"
        }
      },
      planFeatures: {
        lockedTitle: "{{feature}} no está en tu plan",
        lockedText:
          "Esta función pertenece a otro plan. Habla con el administrador de la plataforma para activarla.",
        lockedAction: "Ver mi plan",
        names: {
          useKanban: "Kanban",
          useInternalChat: "Chat interno",
          useSchedules: "Programados",
          useCampaigns: "Campañas",
          useExternalApi: "API de mensajes"
        },
        hints: {
          useKanban: "Tablero con las conversaciones en columnas por etapa.",
          useInternalChat: "Conversaciones del equipo dentro del sistema.",
          useSchedules: "Programar mensajes para una fecha y hora.",
          useCampaigns: "Envío masivo a listas de contactos.",
          useExternalApi: "Enviar mensajes desde otros sistemas, con token."
        }
      },
      plansPage: {
        title: "Planes",
        subtitle: "Límites y funciones de cada plan que vendes.",
        new: "Nuevo plan",
        edit: "Editar plan",
        editShort: "Editar",
        delete: "Eliminar plan",
        templatesTitle: "Modelos listos",
        templates: {
          start: "Para quien empieza, con un número.",
          pro: "El más vendido: equipo pequeño y programados.",
          business: "Equipo grande, campañas y API incluidas.",
          enterprise: "Operación a escala, sin límites."
        },
        featuresTitle: "Funciones incluidas",
        popular: "Más vendido",
        public: "Público",
        private: "Interno",
        perMonth: "/mes",
        form: {
          name: "Nombre del plan",
          value: "Valor mensual",
          users: "Usuarios",
          connections: "Conexiones",
          queues: "Colas",
          currency: "Moneda",
          public: "Aparece en el registro",
          publicHint:
            "Los planes internos solo los usas tú al crear la empresa."
        },
        saved: "Plan guardado",
        saveError:
          "No se pudo guardar. Verifica si ya existe un plan con ese nombre.",
        loadError: "No se pudieron cargar los planes",
        deleteTitle: "¿Eliminar {{name}}?",
        deleteText: "Las empresas que usan este plan quedarán sin plan.",
        deleted: "Plan eliminado",
        deleteError: "No se pudo eliminar el plan"
      },
      queuesPage: {
        subtitle:
          "Organiza la atención por sector y arma el menú automático de cada cola.",
        emptyTitle: "Aún no hay colas",
        emptyText:
          "Crea colas como Ventas, Soporte o Finanzas para distribuir las atenciones.",
        chatbot: "Chatbot · {{count}} opción",
        chatbot_plural: "Chatbot · {{count}} opciones",
        noChatbot: "Sin chatbot",
        hours: "Horario definido",
        noGreeting: "Sin mensaje de saludo",
        users: "Agentes",
        connections: "Conexiones",
        tickets: "Abiertos + cola",
        edit: "Editar",
        delete: "Eliminar",
        new: "Nueva cola"
      },
      loginShowcase: {
        title: "Toda la atención de tu empresa en un solo lugar",
        text: "WhatsApp, equipo y clientes en el mismo panel — con Kanban, programados e informes."
      },
      annotator: {
        title: "Documento",
        annotate: "Dibujar",
        typeHere: "Escribe aquí",
        tools: {
          pan: "Mover",
          pen: "Dibujar",
          highlight: "Resaltar",
          underline: "Subrayar",
          strike: "Tachar",
          text: "Texto",
          eraser: "Borrador"
        },
        sizes: {
          thin: "Fino",
          medium: "Medio",
          thick: "Grueso"
        },
        undo: "Deshacer (Ctrl+Z)",
        redo: "Rehacer (Ctrl+Shift+Z)",
        clear: "Borrar las anotaciones de esta página",
        download: "Descargar",
        downloadAnnotated: "Descargar con anotaciones",
        send: "Enviar al chat",
        sent: "Archivo anotado enviado",
        done: "Listo",
        error: "No se pudo abrir el archivo.",
        loadingPreview: "Cargando vista previa…",
        previewUnavailable: "Vista previa no disponible",
        openAndAnnotate: "Abrir y anotar"
      },
      superDashboard: {
        title: "Panel de la plataforma",
        live: "En vivo",
        tabs: {
          platform: "Resumen",
          revenue: "Cobros",
          companies: "Empresas",
          mine: "Mi empresa"
        },
        server: "Servidor",
        cpu: "Procesador",
        cpuSub: "{{cores}} núcleos · carga {{load}}",
        ram: "Memoria RAM",
        app: "app",
        disk: "Espacio en disco",
        free: "{{size}} libres",
        database: "Base de datos",
        processSub:
          "Backend {{rss}} · activo hace {{uptime}} · {{online}} en línea",
        platform: "Uso de la plataforma",
        companies: "Empresas activas",
        ofTotal: "de {{total}} registradas",
        users: "Usuarios",
        onlineNow: "{{count}} en línea ahora",
        connections: "Conexiones",
        connected: "conectadas",
        tickets: "Atenciones abiertas",
        pending: "{{count}} en espera",
        messagesToday: "Mensajes hoy",
        last30: "{{count}} en 30 días",
        storage: "Almacenamiento",
        contacts: "{{count}} contactos",
        activity: "Mensajes en los últimos 14 días",
        sent: "Enviados",
        received: "Recibidos",
        ranking: "Uso por empresa",
        metrics: {
          messages30d: "Mensajes",
          tickets30d: "Atenciones",
          storage: "Disco",
          users: "Usuarios"
        },
        clients: "Clientes",
        search: "Buscar empresa",
        active: "Activa",
        blocked: "Bloqueada",
        dueIn: "vence en {{count}} día",
        dueIn_plural: "vence en {{count}} días",
        overdue: "vencida hace {{count}} día",
        overdue_plural: "vencida hace {{count}} días",
        max: "máx. {{count}}",
        onlineShort: "en línea",
        openShort: "abiertas",
        messagesShort: "msgs 30d",
        usersOf: "{{count}} usuario creado",
        usersOf_plural: "{{count}} usuarios creados",
        online: "En línea",
        offline: "Desconectado",
        inactive: "inactivo",
        userStats: "{{open}} abiertas · {{sent}} msgs enviados en 30 días",
        newAdmin: "Nuevo administrador",
        newAdminHint:
          "El administrador crea y gestiona los usuarios de su empresa.",
        adminCreated: "Administrador creado",
        create: "Crear",
        form: {
          name: "Nombre",
          email: "Correo",
          password: "Contraseña"
        }
      },
      contactSchedules: {
        title: "Programados",
        new: "Programar",
        empty: "No hay mensajes programados para este contacto.",
        pending: "{{count}} por enviar",
        pending_plural: "{{count}} por enviar",
        in: "sale en {{time}}",
        soon: "enviando ahora",
        sentAgo: "enviado {{time}}",
        failedAgo: "falló {{time}}",
        all: "Ver todos ({{count}})",
        less: "Mostrar menos",
        status: {
          pending: "Programado",
          sent: "Enviado",
          error: "Error"
        }
      },
      financePage: {
        title: "Finanzas",
        subtitle: "Sigue tu suscripción y tus cobros.",
        days: "día",
        days_plural: "días",
        heroOk: "¡Todo en orden! Falta {{count}} día para la renovación",
        heroOk_plural:
          "¡Todo en orden! Faltan {{count}} días para la renovación",
        heroToday: "Tu suscripción se renueva hoy",
        heroSub: "Tu acceso está garantizado hasta el {{date}}.",
        heroOverdue: "Tu suscripción venció hace {{count}} día",
        heroOverdue_plural: "Tu suscripción venció hace {{count}} días",
        heroOverdueSub:
          "Paga el cobro pendiente para seguir usándolo sin interrupciones.",
        payNow: "Pagar ahora",
        statOpen: "Pendiente",
        statPending: "Por pagar",
        statPaid: "Pagadas",
        history: "Cobros",
        emptyTitle: "Aún no hay cobros",
        emptyText: "Cuando haya una factura, aparecerá aquí.",
        invoice: "Mensualidad",
        number: "Factura #{{id}}",
        paid: "Pagada",
        dueToday: "Vence hoy",
        dueTomorrow: "Vence mañana",
        daysLeft: "Falta {{count}} día",
        daysLeft_plural: "Faltan {{count}} días",
        overdueFor: "Venció hace {{count}} día",
        overdueFor_plural: "Venció hace {{count}} días",
        dueOn: "Vence el {{date}}",
        dueWas: "Venció el {{date}}",
        pay: "Pagar",
        paidBtn: "Pagada ✓"
      },
      forwardModal: {
        title: "Reenviar mensaje a",
        search: "Buscar nombre o número",
        recent: "Chats recientes",
        contacts: "Contactos",
        empty: "No se encontraron contactos",
        group: "Grupo",
        remove: "Quitar",
        max: "Puedes reenviar hasta a {{count}} chats",
        caption: "Añade un mensaje",
        send: "Reenviar",
        sent: "Mensaje reenviado",
        sent_plural: "Mensaje reenviado a {{count}} chats",
        queue: "Cola: {{name}}",
        queueHint: "Cola usada cuando el contacto no tiene atención abierta",
        media: {
          image: "Foto",
          video: "Video",
          audio: "Audio",
          document: "Archivo",
          sticker: "Sticker"
        }
      },
      instances: {
        summary: "{{connected}} de {{total}} conectadas",
        new: "Nueva conexión",
        noProfile: "El perfil aparece al conectar",
        updated: "Actualizado {{time}}",
        default: "Conexión predeterminada",
        channel: "Canal",
        queues: "Colas",
        lastUpdate: "Última actualización",
        yes: "Sí",
        no: "No",
        status: {
          CONNECTED: "Conectado",
          qrcode: "Esperando código QR",
          passkey_required: "Passkey necesaria",
          PAIRING: "Sin señal del teléfono",
          TIMEOUT: "Sin señal del teléfono",
          OPENING: "Conectando…",
          DISCONNECTED: "Desconectado"
        },
        actions: {
          scan: "Leer código QR",
          retry: "Reconectar",
          passkey: "Usar passkey",
          newQr: "Nuevo código QR",
          resetPasskey: "Reiniciar passkey",
          disconnect: "Desconectar",
          refresh: "Rehacer conexión",
          edit: "Configurar",
          privacy: "Privacidad",
          delete: "Eliminar"
        }
      },
      orientation: {
        title: "Gira el teléfono",
        text: "Tekvosoft está pensado para usarse en vertical. Gira el dispositivo para continuar."
      },
      ticketHeaderActions: {
        resolve: "Resolver",
        resolveHint: "Marcar como terminado y cerrar la atención",
        resolved: "Atención resuelta",
        transfer: "Transferir",
        transferHint: "Pasar a otra cola o agente",
        return: "Devolver a la cola",
        returnHint: "Vuelve a En espera, sin agente",
        schedule: "Programar mensaje",
        scheduleHint: "Programar un envío a este contacto",
        delete: "Eliminar atención",
        deleteHint: "Borra la atención y sus mensajes",
        reopen: "Reabrir",
        more: "Más acciones"
      },
      usersPage: {
        subtitle: "Quién puede entrar y atender por tu empresa.",
        filters: {
          all: "Todos",
          active: "Activos",
          inactive: "Inactivos"
        },
        active: "Activo",
        inactive: "Inactivo",
        activateHint: "Permitir el acceso de este usuario",
        deactivateHint:
          "Bloquear el acceso: la persona sale del sistema al instante",
        selfHint: "No puedes desactivarte a ti mismo",
        activated: "{{name}} está activo",
        deactivated: "{{name}} fue desactivado",
        edit: "Editar",
        delete: "Eliminar",
        deactivatedByAdmin: "Tu acceso fue desactivado por el administrador."
      },
      chatWallpaper: {
        tabs: {
          gif: "Animados",
          image: "Fotos",
          color: "Colores",
          classic: "Clásicos"
        },
        title: "Fondo de las conversaciones",
        subtitle:
          "Dibujado con los colores del tema elegido. Tus burbujas de mensaje también siguen la paleta.",
        sampleIn: "¡Hola! ¿Qué tal? 😊",
        sampleOut: "Todo bien, ¿en qué puedo ayudar?",
        options: {
          landscape: "Paisaje",
          waves: "Olas",
          gradient: "Degradado",
          doodle: "Garabatos",
          plain: "Liso"
        }
      },
      date: {
        yesterday: "Ayer"
      },
      common: {
        yesterday: "Ayer",
        today: "Hoy",
        search: "Buscar",
        emptyTitle: "Aún no hay nada aquí",
        emptyDescription:
          "Los registros aparecerán en esta lista en cuanto existan.",
        emptySearchTitle: "Sin resultados",
        emptySearchDescription:
          "Nada coincide con tu búsqueda. Prueba otro término.",
        filter: "Filtrar",
        edit: "Editar",
        delete: "Eliminar",
        cancel: "Cancelar",
        save: "Guardar",
        confirm: "Confirmar",
        confirmation: "Confirmación",
        areyousure: "¿Estás seguro?",
        close: "Cerrar",
        back: "Volver",
        closed: "Cerrado",
        error: "Error",
        success: "Éxito",
        actions: "Acciones",
        add: "Añadir",
        name: "Nombre",
        email: "Correo electrónico",
        phone: "Teléfono",
        language: "Idioma",
        company: "Empresa",
        user: "Usuario",
        users: "Usuarios",
        connection: "Conexión",
        connections: "Conexiones",
        queue: "Cola",
        queues: "Colas",
        contact: "Contacto",
        messages: "Mensajes",
        whatsappNumber: "Número de WhatsApp",
        dueDate: "Fecha de vencimiento",
        copy: "Copiar",
        paste: "Pegar",
        proceed: "Proceder",
        enabled: "Activado",
        disabled: "Desactivado",
        undefined: "Indefinido",
        yes: "Sí",
        no: "No",
        noqueue: "Sin cola",
        rating: "Calificación",
        transferTo: "Transferir a",
        key: "Clave",
        value: "Valor",
        validations: {
          required: "Este campo es obligatorio",
          short: "Valor demasiado corto",
          long: "Valor demasiado largo",
          invalid: "Valor inválido",
          invalidEmail: "Correo electrónico inválido",
          invalidPhone: "Número de teléfono inválido"
        },
        status: "Estado",
        serverTime: "Hora del servidor:",
        clientTime: "Hora del cliente:",
        differenceMinutes: "Diferencia: {{count}} minuto(s)"
      },
      signup: {
        options: {
          segment: {
            retail: "Comercio / Tienda",
            services: "Servicios",
            health: "Salud y bienestar",
            education: "Educación",
            food: "Alimentación",
            realEstate: "Inmobiliario",
            tech: "Tecnología",
            other: "Otro"
          },
          teamSize: {
            1: "Solo yo",
            "2-5": "2 a 5 personas",
            "6-20": "6 a 20 personas",
            "21-50": "21 a 50 personas",
            "50+": "Más de 50"
          },
          goal: {
            sales: "Vender más",
            support: "Atención / soporte",
            scheduling: "Agendamientos",
            marketing: "Campañas y marketing",
            other: "Otro"
          },
          source: {
            google: "Google",
            instagram: "Instagram",
            youtube: "YouTube",
            referral: "Recomendación",
            other: "Otro"
          }
        },
        aboutBusiness: "Sobre tu negocio",
        subheading: "7 días gratis. Sin tarjeta de crédito.",
        heading: "Crea tu cuenta",
        title: "Registrarse",
        toasts: {
          success: "Usuario creado con éxito. ¡Inicia sesión ahora!",
          fail: "Error al crear usuario. Verifica los datos proporcionados."
        },
        form: {
          source: "¿Cómo nos conociste?",
          goal: "Objetivo principal",
          teamSize: "Tamaño del equipo",
          segment: "Segmento",
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña"
        },
        buttons: {
          submit: "Registrarse",
          login: "¿Ya tienes una cuenta? ¡Inicia sesión!"
        }
      },
      login: {
        subheading: "Inicia sesión para continuar tus atenciones.",
        heading: "Bienvenido de nuevo",
        title: "Iniciar sesión",
        form: {
          email: "Correo electrónico",
          password: "Contraseña"
        },
        buttons: {
          submit: "Entrar",
          register: "¿No tienes una cuenta? ¡Regístrate!"
        }
      },
      companies: {
        title: "Registrar Empresa",
        form: {
          name: "Nombre de la Empresa",
          plan: "Plan",
          token: "Token",
          submit: "Registrar",
          success: "Empresa creada con éxito"
        }
      },
      companiesManager: {
        form: {
          campaigns: "Campañas",
          recurrence: "Recurrencia",
          monthly: "Mensual",
          bimonthly: "Bimestral",
          quarterly: "Trimestral",
          semiannual: "Semestral",
          annual: "Anual"
        },
        buttons: {
          clear: "Limpiar",
          accessAs: "Acceder como",
          incrementDueDate: "+ Vencimiento",
          user: "Usuario"
        },
        table: {
          storage: "Almacenamiento",
          campaigns: "Campañas",
          createdAt: "Creada el"
        },
        toasts: {
          loadError: "No se pudo cargar la lista de registros",
          operationSuccess: "Operación realizada con éxito",
          operationError: "No se pudo realizar la operación",
          operationErrorDuplicate:
            "No se pudo realizar la operación. Verifique si ya existe una empresa con el mismo nombre o si los campos fueron completados correctamente"
        },
        confirmationModal: {
          deleteTitle: "Eliminación de Registro",
          deleteMessage: "¿Realmente desea eliminar este registro?",
          impersonateTitle: "Acceder como",
          impersonateMessage: "¿Desea acceder al sistema como esta empresa?"
        }
      },
      auth: {
        toasts: {
          success: "Inicio de sesión exitoso"
        },
        token: "Token"
      },
      dashboard: {
        sections: {
          now: "Ahora",
          nowHint: "Situación en tiempo real",
          period: "En el período",
          periodHint: "Números del intervalo elegido",
          team: "Equipo",
          teamHint: "Desempeño de cada agente en el período"
        },
        team: {
          online: "En línea",
          offline: "Desconectado",
          total: "Total",
          open: "Abiertos",
          closed: "Resueltos",
          wait: "Espera",
          service: "Atención"
        },
        usersOnline: "Usuarios en línea",
        ticketsOpen: "Atenciones abiertas",
        ticketsDone: "Atenciones resueltas",
        totalTickets: "Total de atenciones",
        newContacts: "Nuevos contactos",
        avgServiceTime: "Tiempo promedio de atención",
        avgWaitTime: "Tiempo promedio de espera",
        ticketsOnPeriod: "Atenciones en el período",
        userCurrentStatus: "Estado (Actual)",
        filter: {
          invalid: "Elige un período válido para filtrar.",
          period: "Período",
          custom: "Personalizado",
          last3days: "Últimos 3 días",
          last7days: "Últimos 7 días",
          last14days: "Últimos 14 días",
          last30days: "Últimos 30 días",
          last90days: "Últimos 90 días"
        },
        date: {
          start: "Fecha de inicio",
          end: "Fecha de fin"
        },
        ticketCountersLabels: {
          created: "Creado",
          closed: "Cerrado"
        }
      },
      connections: {
        title: "Conexiones",
        toasts: {
          deleted: "Conexión con WhatsApp eliminada con éxito"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? Esta acción no se puede deshacer.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "¿Estás seguro? Tendrás que escanear el código QR nuevamente.",
          closeTickets: "Cerrar todas las atenciones de esta conexión"
        },
        buttons: {
          add: "Agregar WhatsApp",
          disconnect: "Desconectar",
          tryAgain: "Intentar nuevamente",
          qrcode: "CÓDIGO QR",
          newQr: "Nuevo CÓDIGO QR",
          connecting: "Conectando"
        },
        toolTips: {
          disconnected: {
            title: "Error al iniciar sesión en WhatsApp",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet y vuelve a intentarlo o solicita un nuevo código QR."
          },
          qrcode: {
            title: "Esperando lectura del código QR",
            content:
              "Haz clic en el botón 'CÓDIGO QR' y escanea el código QR con tu teléfono para iniciar la sesión."
          },
          connected: {
            title: "Conexión establecida"
          },
          timeout: {
            title: "Se perdió la conexión con el teléfono",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet y WhatsApp esté abierto, o haz clic en 'Desconectar' para obtener un nuevo código QR."
          },
          passkey: {
            title: "Se requiere autenticación por passkey",
            content:
              "Haz clic en el botón de passkey y usa la extensión del navegador para capturar la sesión autenticada de WhatsApp Web."
          },
          refresh: "Actualizar",
          disconnect: "Desconectar",
          scan: "Escanear",
          newQr: "Nuevo Código QR",
          retry: "Intentar nuevamente",
          resetPasskey: "Restablecer sesión passkey"
        },
        table: {
          name: "Nombre",
          status: "Estado",
          lastUpdate: "Última actualización",
          default: "Predeterminado",
          actions: "Acciones",
          session: "Sesión"
        }
      },
      trialBanner: {
        daysLeft: "Tu prueba gratis termina en {{count}} días",
        tomorrow: "Tu prueba gratis termina mañana",
        today: "Tu prueba gratis termina hoy",
        ended: "Tu prueba gratis terminó",
        cta: "Suscribirse ahora"
      },
      mediaPreview: {
        add: "Agregar archivo",
        captionPlaceholder: "Añadir un comentario…",
        position: "{{current}} de {{total}}",
        files: "archivos",
        remove: "Quitar",
        send: "Enviar"
      },
      internalChat: {
        channelsCount_plural: "{{count}} canales",
        channelsCount: "{{count}} canal",
        newChannel: "Crear canal",
        allAreas: "Todas las conversaciones",
        areas: "Áreas",
        areaHelp:
          "Los canales se agrupan por área en las burbujas de la izquierda.",
        areaPlaceholder: "Ej.: Ventas, Soporte, Finanzas",
        area: "Área",
        title: "Chat Interno",
        subtitle: "Conversaciones con tu equipo",
        newChat: "Nueva conversación",
        emptyListTitle: "Aún no hay conversaciones",
        emptyListDescription:
          "Crea una conversación y elige quién del equipo participa.",
        selectTitle: "Selecciona una conversación",
        selectDescription:
          "Elige una conversación de la lista o empieza una nueva con tu equipo.",
        participants: "participantes",
        typeMessage: "Escribe un mensaje",
        edit: "Editar",
        delete: "Eliminar",
        deleteTitle: "Eliminar conversación",
        deleteMessage: "Esta acción no se puede deshacer. ¿Confirmar?",
        you: "Tú"
      },
      whatsappModal: {
        title: {
          add: "Agregar WhatsApp",
          edit: "Editar WhatsApp"
        },
        form: {
          name: "Nombre",
          default: "Predeterminado"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "WhatsApp guardado con éxito."
      },
      qrCode: {
        message: "Lee el código QR para iniciar la sesión",
        extensionHint: "Autenticar a través de WhatsApp Web",
        startCapture: "Capturar sesión de WhatsApp Web",
        installExtension: "Instalar Extensión de Captura"
      },
      passkeyModal: {
        title: "Extensión de Captura de WhatsApp Web",
        instructions:
          "Usa la extensión del navegador para capturar la sesión autenticada de WhatsApp Web y enviarla al servidor.",
        connectorNotFound:
          "Extensión no detectada. Instala la extensión de captura passkey y recarga la página.",
        connectorReady:
          "Extensión detectada. Haz clic abajo para autenticarte a través de WhatsApp Web.",
        startCapture: "Iniciar Captura",
        waitingForCapture: "Esperando la captura de la sesión de WhatsApp Web…",
        existingSession: "WhatsApp Web ya tiene una sesión para {{number}}.",
        captureExisting: "Capturar esta sesión",
        clearAndContinue: "Borrar sesión local y continuar",
        importSent: "Sesión capturada y enviada con éxito.",
        importError: "Error en la captura: {{reason}}.",
        missingToken: "Falta el token de captura. Recarga la página.",
        downloadExtension: "Descargar extensión de captura",
        installInstructions: "Cómo instalar",
        hideInstructions: "Ocultar instrucciones",
        instructionsIntro:
          "Siga los pasos a continuación para instalar la extensión:",
        installStep1: "Descargue el archivo ZIP de la extensión.",
        installStep2:
          "Extraiga el archivo ZIP en una carpeta de su computadora.",
        installStep3: "Abra Google Chrome y vaya a chrome://extensions/.",
        installStep4:
          "Active el Modo de desarrollador con el interruptor de la esquina superior derecha.",
        installStep5: 'Haga clic en "Cargar descomprimida".',
        installStep6:
          "Seleccione la carpeta extraída que contiene los archivos de la extensión.",
        installStep7: "La extensión está instalada y lista para usar.",
        installStep8:
          "Actualice esta página con F5 e intente conectarse de nuevo."
      },
      contacts: {
        title: "Contactos",
        toasts: {
          imported:
            "Importación iniciada. Los contactos aparecerán en la lista en breve.",
          deleted: "Contacto eliminado con éxito"
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deleteTitle: "Eliminar ",
          importTitlte: "Importar contactos",
          deleteMessage:
            "¿Estás seguro de que deseas eliminar este contacto? Se perderán todas las conversaciones relacionadas.",
          importMessage: "¿Quieres importar todos los contactos del teléfono?"
        },
        buttons: {
          importCsv: "Importar desde archivo CSV",
          exportCsv: "Exportar a CSV",
          import: "Importar Contactos",
          add: "Agregar Contacto"
        },
        table: {
          name: "Nombre",
          whatsapp: "WhatsApp",
          email: "Correo electrónico",
          actions: "Acciones"
        }
      },
      contactModal: {
        title: {
          add: "Agregar contacto",
          edit: "Editar contacto"
        },
        form: {
          mainInfo: "Datos del contacto",
          extraInfo: "Información adicional",
          name: "Nombre",
          number: "Número de WhatsApp",
          email: "Correo electrónico",
          extraName: "Nombre del campo",
          extraValue: "Valor",
          disableBot: "Desativar bot de conversa"
        },
        buttons: {
          addExtraInfo: "Agregar información",
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Contacto guardado con éxito."
      },
      queueModal: {
        confirmationModal: {
          deleteTitle: "¿Eliminar archivo?",
          deleteMessage:
            "El archivo adjunto será eliminado. No se puede deshacer."
        },
        title: {
          add: "Agregar fila",
          edit: "Editar fila"
        },
        form: {
          name: "Nombre",
          color: "Color",
          greetingMessage: "Mensaje de bienvenida",
          complationMessage: "Mensaje de conclusión",
          outOfHoursMessage: "Mensaje fuera del horario",
          ratingMessage: "Mensaje de calificación",
          transferMessage: "Mensaje de transferencia",
          token: "Token"
        },
        toasts: {
          deleted: "Archivo eliminado",
          saved: "Cola guardada exitosamente"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
          attach: "Adjuntar archivo"
        },
        serviceHours: {
          dayWeek: "Día de la semana",
          startTimeA: "Hora de inicio - Turno A",
          endTimeA: "Hora de finalización - Turno A",
          startTimeB: "Hora de inicio - Turno B",
          endTimeB: "Hora de finalización - Turno B",
          monday: "Lunes",
          tuesday: "Martes",
          wednesday: "Miércoles",
          thursday: "Jueves",
          friday: "Viernes",
          saturday: "Sábado",
          sunday: "Domingo"
        }
      },
      userModal: {
        photo: {
          add: "Agregar foto",
          change: "Cambiar foto",
          remove: "Quitar",
          hint: "JPG o PNG. Aparece en la barra superior, el menú y el chat interno.",
          saved: "Foto actualizada",
          removed: "Foto eliminada"
        },
        title: {
          add: "Agregar usuario",
          edit: "Editar usuario"
        },
        listItems: {
          adminProfile: "Administrador",
          userProfile: "Usuario"
        },
        form: {
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña",
          profile: "Perfil"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Usuario guardado con éxito."
      },
      scheduleModal: {
        mediaOrText: "Escribe un mensaje o adjunta una imagen.",
        removeMedia: "Quitar adjunto",
        addMedia: "Agregar imagen",
        title: {
          add: "Nuevo Agendamiento",
          edit: "Editar Agendamiento"
        },
        form: {
          body: "Mensaje",
          contact: "Contacto",
          sendAt: "Fecha de Agendamiento",
          sentAt: "Fecha de Envío",
          saveMessage: "Guardar mensaje en el ticket"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Agendamiento guardado con éxito."
      },
      tagModal: {
        title: {
          add: "Nueva Etiqueta",
          edit: "Editar Etiqueta",
          addKanban: "Nueva Columna",
          editKanban: "Editar Columna"
        },
        form: {
          name: "Nombre",
          color: "Color",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Etiqueta guardada con éxito.",
        successKanban: "Columna guardada con éxito."
      },
      chat: {
        noTicketMessage: "Selecciona un ticket para empezar a conversar."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop:
            "ARRASTRA Y SUELTA ARCHIVOS EN EL CAMPO ABAJO",
          titleFileList: "Lista de archivo(s)"
        }
      },
      todolist: {
        title: "Lista de tareas",
        form: {
          name: "Nombre de la tarea"
        },
        buttons: {
          add: "Añadir",
          save: "Guardar"
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nuevo"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Colas"
      },
      tickets: {
        toasts: {
          deleted: "La atención que estabas siguiendo fue eliminada."
        },
        notification: {
          message: "Mensaje de",
          nomessages: "Ningún mensaje"
        },
        tabs: {
          open: { title: "Abiertas" },
          closed: { title: "Resueltos" },
          groups: { title: "Grupos" },
          search: { title: "Búsqueda" }
        },
        search: {
          filterByUsers: "Filtrar por usuarios",
          filterByTags: "Filtrar por etiquetas",
          placeholder: "Buscar atención y mensajes"
        },
        buttons: {
          showAll: "Todos"
        }
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Escribe para buscar usuarios",
        fieldQueueLabel: "Transferir a cola",
        fieldQueuePlaceholder: "Selecciona una cola",
        noOptions: "Ningún usuario encontrado con ese nombre",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar"
        }
      },
      ticketsList: {
        media: {
          photo: "Foto",
          audio: "Audio",
          video: "Video",
          document: "Documento",
          gif: "GIF",
          sticker: "Sticker"
        },
        pendingHeader: "Esperando",
        assignedHeader: "Atendiendo",
        noTicketsTitle: "¡Nada aquí!",
        noTicketsMessage:
          "No se encontraron atenciones con ese estado o término de búsqueda",
        buttons: {
          accept: "Aceptar"
        }
      },
      newTicketModal: {
        title: "Crear Ticket",
        fieldLabel: "Escribe para buscar el contacto",
        add: "Agregar",
        buttons: {
          ok: "Guardar",
          cancel: "Cancelar"
        }
      },
      mainDrawer: {
        sections: {
          service: "Atención",
          audience: "Contactos",
          management: "Gestión",
          system: "Sistema"
        },
        listItems: {
          dashboard: "Tablero",
          connections: "Conexiones",
          tickets: "Atenciones",
          quickMessages: "Respuestas Rápidas",
          contacts: "Contactos",
          queues: "Filas y Chatbot",
          tags: "Etiquetas",
          administration: "Administración",
          service: "Atención",
          users: "Usuarios",
          settings: "Configuraciones",
          helps: "Ayuda",
          messagesAPI: "API",
          schedules: "Agendamientos",
          campaigns: "Campañas",
          annoucements: "Anuncios",
          chats: "Chat Interno",
          chatsShort: "Chat",
          ticketsShort: "Tickets",
          search: "Buscar",
          online: "En línea",
          noResults: "Nada encontrado",
          financeiro: "Financiero",
          logout: "Cerrar sesión",
          management: "Gerencia",
          kanban: "Kanban",
          tasks: "Tareas",
          more: "Más",
          menu: "Menú"
        },
        appBar: {
          i18n: {
            language: "Español",
            language_short: "ES"
          },
          user: {
            profile: "Perfil",
            subscriptionValidUntilLabel: "Suscripción válida hasta",
            darkmode: "Modo oscuro",
            lightmode: "Modo claro",
            language: "Seleccionar idioma",
            logout: "Cerrar sesión"
          }
        }
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Número",
          body: "Mensaje",
          token: "Token registrado"
        },
        mediaMessage: {
          number: "Número",
          body: "Nombre del archivo",
          media: "Archivo",
          token: "Token registrado"
        }
      },
      notifications: {
        noTickets: "Ninguna notificación.",
        volume: "Volumen de notificaciones"
      },
      quickMessages: {
        title: "Respuestas Rápidas",
        buttons: {
          add: "Nueva Respuesta"
        },
        dialog: {
          shortcode: "Atajo",
          message: "Respuesta"
        }
      },
      kanban: {
        title: "Kanban",
        subtitle:
          "Arrastra los contactos entre columnas para seguir cada etapa de la atención.",
        inbox: "Abiertos",
        newLane: "Nueva columna",
        editLane: "Editar columna",
        deleteLane: "Eliminar columna",
        deleteLaneTitle: "Eliminar la columna",
        deleteLaneMessage:
          "Las atenciones de esta columna vuelven a Abiertos. No se elimina ninguna atención.",
        moveTo: "Mover a",
        moveLeft: "Mover a la izquierda",
        moveRight: "Mover a la derecha",
        openConversation: "Abrir conversación",
        emptyLane: "Arrastra atenciones aquí",
        noLanesTitle: "Arma tu tablero",
        noLanesDescription:
          "Crea columnas con nombre y color para organizar las atenciones por etapa: nuevo, negociando, pagado…",
        unassigned: "Sin agente",
        moved: "Atención movida",
        ticketsCount: "atenciones",
        searchPlaceholder: "Búsqueda",
        subMenus: {
          list: "Panel",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "En abierto",
        confirmationModal: {
          deleteTitle: "¿Estás seguro de que quieres eliminar esta Lane?",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        table: {
          name: "Nombre",
          color: "Color",
          tickets: "Tickets",
          actions: "Acciones"
        },
        buttons: {
          add: "Nueva Lane"
        },
        toasts: {
          deleted: "Lane eliminada con éxito."
        }
      },
      contactLists: {
        title: "Listas de Contactos",
        table: {
          name: "Nombre",
          contacts: "Contactos",
          actions: "Acciones"
        },
        buttons: {
          add: "Nueva Lista"
        },
        dialog: {
          name: "Nombre",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Agregar",
          add: "Agregar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        toasts: {
          deleted: "Registro eliminado",
          created: "Registro creado"
        }
      },
      contactListItems: {
        title: "Contactos",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo",
          lists: "Listas",
          import: "Importar"
        },
        dialog: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "Correo electrónico",
          okEdit: "Editar",
          okAdd: "Agregar",
          add: "Agregar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        table: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "Correo electrónico",
          actions: "Acciones"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
          importMessage:
            "¿Desea importar los contactos de esta hoja de cálculo?",
          importTitlte: "Importar"
        },
        toasts: {
          deleted: "Registro eliminado"
        }
      },
      campaigns: {
        title: "Campañas",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nueva Campaña",
          contactLists: "Listas de Contactos"
        },
        table: {
          name: "Nombre",
          whatsapp: "Conexión",
          contactList: "Lista de Contactos",
          status: "Estado",
          scheduledAt: "Agendamiento",
          completedAt: "Completada",
          confirmation: "Confirmación",
          actions: "Acciones"
        },
        dialog: {
          new: "Nueva Campaña",
          update: "Editar Campaña",
          readonly: "Solo Lectura",
          form: {
            name: "Nombre",
            message1: "Mensaje 1",
            message2: "Mensaje 2",
            message3: "Mensaje 3",
            message4: "Mensaje 4",
            message5: "Mensaje 5",
            confirmationMessage1: "Mensaje de Confirmación 1",
            confirmationMessage2: "Mensaje de Confirmación 2",
            confirmationMessage3: "Mensaje de Confirmación 3",
            confirmationMessage4: "Mensaje de Confirmación 4",
            confirmationMessage5: "Mensaje de Confirmación 5",
            messagePlaceholder: "Contenido del mensaje",
            whatsapp: "Conexión",
            status: "Estado",
            scheduledAt: "Agendamiento",
            confirmation: "Confirmación",
            contactList: "Lista de Contacto"
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Cerrar",
            attach: "Adjuntar Archivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        toasts: {
          success: "Operación realizada con éxito",
          cancel: "Campaña cancelada",
          restart: "Campaña reiniciada",
          deleted: "Registro eliminado"
        }
      },
      announcements: {
        title: "Anuncios",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo Anuncio",
          contactLists: "Listas de Anuncios"
        },
        table: {
          priority: "Prioridad",
          title: "Título",
          text: "Texto",
          mediaName: "Archivo",
          status: "Estado",
          actions: "Acciones"
        },
        dialog: {
          edit: "Edición de Anuncio",
          add: "Nuevo Anuncio",
          update: "Editar Anuncio",
          readonly: "Solo Lectura",
          form: {
            priority: "Prioridad",
            title: "Título",
            text: "Texto",
            mediaPath: "Archivo",
            status: "Estado"
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Cerrar",
            attach: "Adjuntar Archivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        toasts: {
          success: "Operación realizada con éxito",
          deleted: "Registro eliminado"
        }
      },
      campaignsConfig: {
        title: "Configuraciones de Campañas",
        intervals: "Intervalos",
        messageInterval: "Intervalo entre mensajes (segundos)",
        longerIntervalAfter: "Intervalo mayor después de (mensajes)",
        longerInterval: "Intervalo mayor (segundos)",
        addVariable: "Agregar variable"
      },
      queues: {
        title: "Colas y Chatbot",
        table: {
          name: "Nombre",
          color: "Color",
          greeting: "Mensaje de bienvenida",
          actions: "Acciones"
        },
        toasts: {
          deleted: "Cola eliminada exitosamente"
        },
        buttons: {
          add: "Agregar cola"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "¿Estás seguro? ¡Esta acción no se puede deshacer! Las atenciones de esta cola seguirán existiendo, pero ya no tendrán ninguna cola asignada."
        }
      },
      queueSelect: {
        inputLabel: "Colas"
      },
      users: {
        title: "Usuarios",
        table: {
          name: "Nombre",
          email: "Correo electrónico",
          profile: "Perfil",
          actions: "Acciones"
        },
        buttons: {
          add: "Agregar usuario"
        },
        toasts: {
          deleted: "Usuario eliminado con éxito."
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "Todos los datos del usuario se perderán. Las atenciones abiertas de este usuario se moverán a la cola."
        }
      },
      helps: {
        title: "Centro de Ayuda"
      },
      notificationSound: {
        title: "Sonido de las notificaciones",
        description:
          "Reproduce un aviso sonoro cuando llega un mensaje nuevo. Solo en este dispositivo.",
        on: "activado",
        off: "desactivado"
      },
      push: {
        title: "Notificaciones en este dispositivo",
        description:
          "Recibe los mensajes nuevos con el nombre y la foto del contacto, incluso con la app cerrada.",
        activeDescription:
          "Recibes los mensajes nuevos con el nombre y la foto del contacto, incluso con la app cerrada.",
        enable: "Activar",
        enabled: "Activadas",
        enableOnPhone: "Activar notificaciones",
        enabledToast: "Notificaciones activadas en este dispositivo",
        blocked:
          "Las notificaciones están bloqueadas. Permítelas en la configuración del navegador o del teléfono.",
        failed:
          "No fue posible activar las notificaciones ahora. Inténtalo de nuevo.",
        unsupported: "Este navegador no recibe notificaciones push.",
        iosHint:
          "En iPhone, agrega el sistema a la pantalla de inicio (Compartir > Agregar a inicio) y ábrelo desde allí para activarlas."
      },
      quickReplies: {
        title: "Respuestas rápidas",
        search: "Buscar por atajo o texto",
        empty:
          "Aún no hay respuestas rápidas. Crea la primera para usarla en las conversaciones.",
        emptySearch: "No se encontraron respuestas.",
        use: "Usar esta respuesta",
        edit: "Editar",
        delete: "Eliminar",
        deleteTitle: "¿Eliminar respuesta rápida?",
        deleteMessage:
          "Dejará de estar disponible para el equipo. No se puede deshacer.",
        add: "Nueva respuesta",
        close: "Cerrar",
        added: "Respuesta rápida creada",
        updated: "Respuesta rápida actualizada",
        deleted: "Respuesta rápida eliminada"
      },
      ticketActions: {
        spy: "Espiar conversación",
        close: "Cerrar conversación",
        noQueue: "Sin cola"
      },
      expressions: {
        title: "Emoji, stickers y GIFs",
        emoji: "Emoji",
        stickers: "Stickers",
        gifs: "GIFs",
        searchGifs: "Buscar GIFs",
        noStickers:
          "Los stickers que lleguen en las conversaciones aparecen aquí para reenviarlos.",
        noGifs: "No se encontraron GIFs.",
        gifsNotConfigured:
          "Para usar GIFs, agrega la clave de GIPHY en Configuración > Opciones > Servicios externos.",
        sendSticker: "Enviar sticker",
        sendGif: "Enviar GIF"
      },
      about: {
        headline: "Hecha para atender mejor, todos los días",
        product:
          "Tekvosoft es una plataforma de atención por WhatsApp que reúne a tu equipo en un solo lugar: conversaciones, colas, chatbot, Kanban y chat interno.",
        founder:
          "Soy David Fernandes, tengo 22 años y emprendo en el área de la tecnología.",
        improving:
          "Siempre estoy mejorando Tekvosoft: cada actualización trae ajustes y novedades para que el día a día de quien atiende sea más simple.",
        founderRole: "Fundador de Tekvosoft",
        license: "Software libre bajo la licencia AGPL-3.0.",
        sourceCode: "Código fuente",
        aboutthe: "Acerca de",
        copyright: "© 2024 - Funcionando com Tekvosoft",
        buttonclose: "Cerrar",
        title: "Acerca de Tekvosoft",
        abouttitle: "Origen y Mejoras",
        aboutdetail:
          "El Tekvosoft es derivado indirecto del proyecto Whaticket con mejoras compartidas por los desarrolladores del sistema EquipeChat a través del canal VemFazer en YouTube, posteriormente mejorado por Claudemir Todo Bom.",
        aboutauthorsite: "Sitio del autor",
        aboutwhaticketsite: "Sitio de la Comunidad Whaticket en Github",
        aboutvemfazersite: "Sitio del canal Vem Fazer en Github",
        licenseheading: "Licencia de Código Abierto",
        licensedetail:
          "El Tekvosoft está licenciado bajo la Licencia Pública General Affero de GNU versión 3, lo que significa que cualquier usuario que tenga acceso a esta aplicación tiene derecho a obtener acceso al código fuente. Más información en los siguientes enlaces:",
        licensefulltext: "Texto completo de la licencia",
        licensesourcecode: "Código fuente de Tekvosoft"
      },
      schedules: {
        calendar: {
          subtitle: "Mira en el calendario cuándo se enviará cada mensaje.",
          today: "Hoy",
          list: "Lista",
          month: "Mes",
          all: "Todos",
          pending: "Programada",
          sent: "Enviada",
          error: "Con error",
          more: "más",
          noEvents: "No hay programaciones este mes.",
          noEventsDay: "Nada programado este día",
          scheduleThisDay: "Programar en este día",
          previous: "Mes anterior",
          next: "Mes siguiente",
          count: "{{count}} programación",
          count_plural: "{{count}} programaciones"
        },
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "¿Está seguro de que desea eliminar esta programación?",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        table: {
          contact: "Contacto",
          body: "Mensaje",
          sendAt: "Fecha de Programación",
          sentAt: "Fecha de Envío",
          status: "Estado",
          actions: "Acciones"
        },
        buttons: {
          add: "Nuevo Agendamiento"
        },
        toasts: {
          deleted: "Agendamiento eliminado con éxito."
        }
      },
      tags: {
        title: "Etiquetas",
        confirmationModal: {
          deleteTitle: "¿Está seguro de que quiere eliminar esta etiqueta?",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        table: {
          name: "Nombre",
          color: "Color",
          tickets: "Atenciones",
          contacts: "Contactos",
          actions: "Acciones",
          id: "ID",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nueva Etiqueta"
        },
        toasts: {
          deleted: "Etiqueta eliminada con éxito."
        }
      },
      whitelabel: {
        primaryColorLight: "Color primario claro",
        primaryColorDark: "Color primario oscuro",
        lightLogo: "Logo de la aplicación claro",
        darkLogo: "Logo de la aplicación oscuro",
        favicon: "Favicon de la aplicación",
        appname: "Nombre de la aplicación",
        logoHint: "Prefiera SVG y aspecto de 28:10",
        faviconHint: "Prefiera imagen SVG cuadrada o PNG de 512x512",
        loginLinks: "Enlaces del login",
        loginLinksHint:
          "Agregue pares de título y URL para mostrarlos debajo de la caja de login en escritorio y móvil.",
        linkTitle: "Título del enlace",
        linkUrl: "URL del enlace",
        removeLink: "Eliminar enlace",
        sidePanelImage: "Imagen lateral del login",
        sidePanelImageHint:
          "Se muestra a la izquierda del formulario de login en pantallas de escritorio.",
        backgroundContent: "Contenido de fondo del login",
        backgroundContentHint:
          "Acepta imágenes, archivos SVG y videos MP4 para el fondo de la pantalla de login.",
        noFileSelected: "Todavía no hay archivo seleccionado.",
        buildExtension: "Construir extensión WA Session Capture",
        buildingExtension: "Construyendo extensión…",
        downloadExtension: "Descargar extensión",
        extensionHint:
          "Construye una extensión Chrome personalizada. El ZIP descargado ya contiene los archivos de la extensión: extraiga y cargue la carpeta extraída como extensión desempaquetada.",
        extensionBuildStarted:
          "Construcción de la extensión iniciada. Se le notificará cuando esté lista.",
        extensionBuildFailed:
          "No se pudo iniciar la construcción de la extensión.",
        extensionBuilt: "Extensión construida con éxito.",
        extensionBuildUnknownError: "Error de construcción desconocido."
      },
      settings: {
        saving: "Guardando…",
        appearance: {
          tab: "Apariencia",
          title: "Tema de colores",
          subtitle:
            "Elige los colores del sistema para todo tu equipo. El cambio aparece al instante en la pantalla de todos.",
          mode: "Modo",
          light: "Claro",
          dark: "Oscuro",
          custom: "Personalizado",
          customDescription: "Usa el color de tu marca",
          restore: "Restaurar predeterminado",
          applied: "Tema aplicado",
          restored: "Colores predeterminados restaurados",
          current: "En uso",
          presets: {
            tekvosoft: {
              name: "Morado Tekvosoft",
              description:
                "La identidad predeterminada: violeta vibrante y moderno"
            },
            classicBlue: {
              name: "Azul Clásico",
              description: "Azul profesional, sobrio y confiable"
            },
            forestGreen: {
              name: "Verde Bosque",
              description: "Verde inspirado en la naturaleza"
            },
            oceanTeal: {
              name: "Verde Océano",
              description: "Azul petróleo refrescante, inspirado en el mar"
            },
            sunsetOrange: {
              name: "Naranja Atardecer",
              description: "Tonos cálidos de naranja y ámbar"
            },
            nightPurple: {
              name: "Morado Nocturno",
              description: "Morado profundo y elegante"
            },
            roseRed: {
              name: "Rosa Rosé",
              description: "Rosa intenso y sofisticado"
            },
            cosmic: {
              name: "Cósmico",
              description: "Índigo inspirado en el espacio profundo"
            }
          }
        },
        restartBackend: {
          button: "Reiniciar Backend",
          restarting: "Reiniciando…",
          success: "Reinicio del backend iniciado.",
          error: "Error al reiniciar el backend."
        },
        group: {
          general: "General",
          timeouts: "Tiempos de espera",
          officeHours: "Horas de oficina",
          groups: "Grupos",
          confidenciality: "Confidencialidad",
          api: "API",
          externalServices: "Servicios externos",
          serveradmin: "Administración del servidor"
        },
        success: "Configuraciones guardadas exitosamente.",
        copiedToClipboard: "Copiado al portapapeles",
        title: "Configuraciones",
        chatbotTicketTimeout:
          "Tiempo de espera del ticket del chatbot (minutos)",
        chatbotTicketTimeoutAction: "Acción después del tiempo de espera",
        settings: {
          userCreation: {
            name: "Creación de usuario",
            options: {
              enabled: "Habilitado",
              disabled: "Deshabilitado"
            }
          }
        },
        validations: {
          title: "Validaciones",
          options: {
            enabled: "Habilitado",
            disabled: "Deshabilitado"
          }
        },
        OfficeManagement: {
          title: "Gestión de despachos",
          options: {
            disabled: "Deshabilitado",
            ManagementByDepartment: "Gestión por departamento",
            ManagementByCompany: "Gestión por empresa"
          }
        },
        outOfHoursAction: {
          title: "Acción fuera del horario",
          options: {
            pending: "Dejar pendiente",
            closed: "Cerrar ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignorar mensajes de grupo",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        soundGroupNotifications: {
          title: "Notificaciones de sonido de grupo",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        groupsTab: {
          title: "Pestaña de grupos",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        VoiceAndVideoCalls: {
          title: "Llamadas de voz y vídeo",
          options: {
            enabled: "Ignorar",
            disabled: "informe de indisponibilidad"
          }
        },
        AutomaticChatbotOutput: {
          title: "Salida automática del chatbot",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        ShowNumericEmoticons: {
          title: "Mostrar emojis numéricos en la cola",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        QuickMessages: {
          title: "Respuestas rápidas",
          options: {
            enabled: "Por empresa",
            disabled: "Por Usuario"
          }
        },
        AllowRegistration: {
          title: "Permitir el registro",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        MultiThreadedWbot: {
          title: "Worker Multihilo de WhatsApp",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        FileUploadLimit: {
          title: "Límite de carga de archivos (MB)"
        },
        FileDownloadLimit: {
          title: "Límite de descarga de archivos (MB)"
        },
        messageVisibility: {
          title: "Visibilidad del mensaje",
          options: {
            respectMessageQueue: "Respetar fila de mensajes",
            respectTicketQueue: "Respetar fila de tickets"
          }
        },
        removeQueueAndUser: {
          title: "Mantener fila y usuario en ticket cerrado",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        GracePeriod: {
          title: "Período de gracia después del vencimiento (días)"
        },
        ticketAcceptedMessage: {
          title: "Mensaje de ticket aceptado",
          placeholder: "Ingrese su mensaje de ticket aceptado aquí"
        },
        transferMessage: {
          title: "Mensaje de transferencia",
          placeholder: "Ingrese su mensaje de transferencia aquí"
        },
        mustacheVariables: {
          title: "Variables disponibles:"
        },
        WelcomeGreeting: {
          greetings: "hola",
          welcome: "bienvenido a",
          expirationTime: "Activo hasta"
        },
        Options: {
          title: "Opciones"
        },
        Companies: {
          title: "Empresas"
        },
        schedules: {
          title: "horarios",
          updateToNewFormat: "Actualizar al nuevo formato"
        },
        Plans: {
          title: "Planes",
          public: "Público",
          private: "Privado",
          usersLimit: "Límite de usuarios",
          connectionsLimit: "Límite de conexiones",
          queuesLimit: "Límite de colas",
          currencyCode: "Código de moneda (ISO 4217)"
        },
        Help: {
          title: "Ayuda"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Payment gateways"
        },
        i18nSettings: {
          title: "Traducciones"
        },
        AIProvider: {
          title: "Proveedor de IA"
        },
        AudioTranscriptions: {
          title: "Transcripciones de audio"
        },
        TagsMode: {
          title: "Modo de etiquetas",
          options: {
            ticket: "Ticket",
            contact: "Contacto",
            both: "Ticket y contacto"
          }
        },
        docker: {
          title: "Contenedores Docker",
          description:
            "Gestione los contenedores del servidor: verifique actualizaciones de imagen, pull+reinicie o reinicie.",
          selfBadge: "este backend",
          notChecked: "No verificado",
          updateAvailable: "Actualización disponible",
          upToDate: "Actualizado",
          unavailable: "No disponible",
          unavailableMessage:
            "Servicio Docker no disponible en este servidor. Verifique si el socket de Docker está montado en el contenedor del backend.",
          columns: {
            name: "Nombre",
            image: "Imagen",
            state: "Estado",
            created: "Creado el",
            update: "Actualización",
            actions: "Acciones"
          },
          actions: {
            refreshList: "Actualizar lista",
            checkUpdates: "Verificar actualizaciones",
            checkUpdate: "Verificar actualización",
            updateBackendFrontend: "Actualizar backend y frontend",
            updatingBackendFrontend: "Actualizando backend y frontend...",
            update: "Pull + reiniciar",
            restart: "Reiniciar"
          },
          toasts: {
            updateAvailable: "Actualización disponible para {{name}}",
            selfUpdate:
              "El backend se está actualizando y se reiniciará. Espere unos instantes y recargue la página.",
            selfRestart:
              "El backend se está reiniciando. Espere unos instantes y recargue la página.",
            restarted: "{{name}} reiniciado",
            noUpdates: "No hay actualizaciones disponibles."
          },
          confirm: {
            updateTitle: "Actualizar {{name}}",
            updateAllTitle: "Actualizar backend y frontend",
            updateAllBody:
              "Los contenedores de backend y frontend se actualizarán (pull + recreación). El contenedor del backend se reiniciará y la aplicación estará no disponible por unos instantes. ¿Desea continuar?",
            restartTitle: "Reiniciar {{name}}",
            updateBody:
              'Se hará el pull de la imagen "{{image}}" y el contenedor se recreará con la nueva versión. ¿Desea continuar?',
            restartBody:
              'El contenedor "{{name}}" se reiniciará. ¿Desea continuar?',
            selfWarning:
              "Este es el contenedor del backend: la aplicación estará no disponible por unos instantes."
          },
          dashboardBanner: {
            title: "Actualizaciones de contenedores disponibles",
            description:
              "Hay actualizaciones de imagen de backend y/o frontend disponibles.",
            updateAll: "Actualizar backend y frontend",
            updating: "Actualizando...",
            confirmBody:
              "Los contenedores de backend y frontend se actualizarán (pull + recreación). El contenedor del backend se reiniciará y la aplicación estará no disponible durante aproximadamente 1 minuto. ¿Desea continuar?"
          }
        }
      },
      messagesList: {
        history: {
          load: "Recuperar historial de mensajes",
          more: "Cargar mensajes más antiguos",
          none: "No hay mensajes anteriores de este contacto",
          ticket: "Atención anterior #{{id}}",
          current: "Inicio de esta atención"
        },
        reactions: {
          react: "Reaccionar",
          copy: "Copiar",
          copied: "Mensaje copiado",
          more: "Más opciones",
          you: "Tú"
        },
        header: {
          assignedTo: "Asignado a:",
          tapForInfo: "Toca para ver los datos del contacto",
          buttons: {
            return: "Regresar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceptar",
            call: "Llamar",
            endCall: "Cortar"
          }
        },
        openPaymentLink: "Abrir enlace de pago"
      },
      messagesInput: {
        phone: {
          attach: "Adjuntar",
          camera: "Cámara",
          gallery: "Fotos y videos",
          document: "Documento",
          quickReplies: "Respuestas rápidas",
          signature: "Firma",
          on: "Activada",
          off: "Desactivada",
          recording: "Grabando",
          discardAudio: "Borrar audio",
          sendAudio: "Enviar audio"
        },
        placeholderOpen: "Ingrese un mensaje",
        placeholderClosed:
          "Reabra o acepte este ticket para enviar un mensaje.",
        signMessage: "Firmar",
        replying: "Respondiendo",
        editing: "Editando"
      },
      message: {
        edited: "Editada",
        forwarded: "Reenviado"
      },
      contactDrawer: {
        media: {
          title: "Multimedia, enlaces y docs",
          media: "Multimedia",
          docs: "Docs",
          links: "Enlaces",
          empty_media: "No hay fotos ni videos con este contacto.",
          empty_docs: "No hay documentos con este contacto.",
          empty_links: "No hay enlaces con este contacto.",
          loadMore: "Cargar más"
        },
        phone: {
          edit: "Editar",
          call: "Llamar",
          copy: "Copiar",
          copied: "Número copiado",
          copyFailed: "No se pudo copiar el número",
          schedule: "Programar",
          notes: "Notas",
          email: "Correo",
          tags: "Etiquetas",
          none: "Ninguna",
          queue: "Cola",
          noQueue: "Sin cola",
          attendant: "Agente",
          unassigned: "Sin agente",
          connection: "Conexión",
          ticket: "Atención",
          status: {
            open: "En atención",
            pending: "En espera",
            closed: "Resuelto",
            group: "Grupo"
          }
        },
        header: "Datos de contacto",
        buttons: {
          edit: "Editar contacto"
        },
        extraInfo: "Otra información"
      },
      ticketOptionsMenu: {
        schedule: "Agendamiento",
        delete: "Eliminar",
        transfer: "Transferir",
        appointmentsModal: {
          title: "Observaciones del Ticket",
          textarea: "Observación",
          placeholder: "Ingrese aquí la información que desea registrar"
        },
        confirmationModal: {
          title: "Eliminar el ticket del contacto",
          message:
            "¡Atención! Todas las mensajes relacionados con el ticket se perderán."
        },
        buttons: {
          delete: "Eliminar",
          cancel: "Cancelar"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancelar"
        }
      },
      messageOptionsMenu: {
        delete: "Eliminar",
        edit: "Editar",
        forward: "Reenviar",
        history: "Historial",
        reply: "Responder",
        confirmationModal: {
          title: "¿Borrar mensaje?",
          message: "Esta acción no se puede deshacer."
        }
      },
      messageHistoryModal: {
        close: "Cerrar",
        title: "Historial de edición del mensaje"
      },
      presence: {
        unavailable: "Indisponible",
        available: "Disponible",
        composing: "Escribiendo",
        recording: "Grabando",
        paused: "Pausado"
      },
      privacyModal: {
        success: "Privacidad actualizada",
        title: "Editar privacidad de Whatsapp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Ahorrar"
        },
        form: {
          menu: {
            all: "Todo",
            none: "Nadie",
            contacts: "Mis contactos",
            contact_blacklist: "Contactos seleccionados",
            match_last_seen: "Partido visto por última vez",
            known: "Conocido",
            disable: "Desactivado",
            hrs24: "24 Horas",
            dias7: "7 Días",
            dias90: "90 Días"
          },
          readreceipts:
            "Para actualizar la privacidad de Confirmaciones de lectura",
          profile: "Para actualizar la privacidad de la foto de perfil",
          status: "Para actualizar la privacidad del mensajes",
          online: "Para actualizar la privacidad en línea",
          last: "Para actualizar la privacidad de Última visita",
          groupadd: "Para actualizar la privacidad de Agregar grupos",
          calladd: "Para actualizar la privacidad de Agregar llamada",
          disappearing: "Para actualizar el modo de desaparición predeterminado"
        }
      },
      phoneNumberInput: {
        country: "País",
        phoneNumber: "Número de teléfono",
        localNumber: "Número de teléfono"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR:
          "Error de configuración. Por favor, contacte al soporte.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Reloj fuera de sincronización. Por favor, verifique la configuración de fecha y hora de su dispositivo.",
        ERR_BACKEND_UNREACHABLE:
          "Backend inalcanzable. Por favor, intente nuevamente más tarde.",
        ERR_BACKEND_NOT_READY:
          "El backend se está iniciando y aún no está listo. Reintentando automáticamente."
      },
      backendErrors: {
        ERR_INTERNAL:
          "Error interno del servidor. Por favor, contacte con soporte.",
        ERR_FORBIDDEN: "No tienes permisos para acceder a este recurso.",
        ERR_CHECK_NUMBER: "No se pudo verificar el número de WhatsApp.",
        ERR_NO_OTHER_WHATSAPP:
          "Debe haber al menos un WhatsApp predeterminado.",
        ERR_NO_DEF_WAPP_FOUND:
          "No se encontró ningún WhatsApp predeterminado. Verifique la página de conexiones.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sesión de WhatsApp no se ha inicializado. Verifique la página de conexiones.",
        ERR_WAPP_CHECK_CONTACT:
          "No se pudo verificar el contacto de WhatsApp. Verifique la página de conexiones",
        ERR_WAPP_INVALID_CONTACT: "Este no es un número de WhatsApp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "No se pudo descargar medios de WhatsApp. Verifique la página de conexiones.",
        ERR_USER_INACTIVE:
          "Tu acceso está desactivado. Habla con el administrador de tu empresa.",
        ERR_INVALID_CREDENTIALS:
          "Error de autenticación. Por favor, inténtelo de nuevo.",
        ERR_SENDING_WAPP_MSG:
          "Error al enviar mensaje de WhatsApp. Verifique la página de conexiones.",
        ERR_DELETE_WAPP_MSG: "No se pudo eliminar el mensaje de WhatsApp.",
        ERR_EDITING_WAPP_MSG: "No se pudo editar el mensaje de WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Ya hay un ticket abierto para este contacto.",
        ERR_SESSION_EXPIRED: "Sesión expirada. Por favor, inicie sesión.",
        ERR_USER_CREATION_DISABLED:
          "La creación de usuarios está deshabilitada por el administrador.",
        ERR_NO_PERMISSION: "No tiene permisos para acceder a este recurso.",
        ERR_DUPLICATED_CONTACT: "Ya existe un contacto con este número.",
        ERR_NO_SETTING_FOUND:
          "No se encontró ninguna configuración con este ID.",
        ERR_NO_CONTACT_FOUND: "No se encontró ningún contacto con este ID.",
        ERR_NO_TICKET_FOUND: "No se encontró ningún ticket con este ID.",
        ERR_NO_USER_FOUND: "No se encontró ningún usuario con este ID.",
        ERR_NO_WAPP_FOUND: "No se encontró ningún WhatsApp con este ID.",
        ERR_CREATING_MESSAGE: "Error al crear el mensaje en la base de datos.",
        ERR_CREATING_TICKET: "Error al crear el ticket en la base de datos.",
        ERR_FETCH_WAPP_MSG:
          "Error al recuperar el mensaje de WhatsApp, tal vez sea muy antiguo.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Este color ya está en uso, elija otro.",
        ERR_WAPP_GREETING_REQUIRED:
          "El mensaje de saludo es obligatorio cuando hay más de una cola."
      },
      phoneCall: {
        hangup: "Cortar"
      },
      wavoipModal: {
        title: "Ingrese el token de su conexión en Wavoip",
        instructions:
          "Accediendo a la siguiente dirección puede crear una cuenta con 50 llamadas gratuitas para prueba"
      },
      openHours: {
        title: "Horarios de Atención",
        timezone: {
          placeholder: "Seleccione la zona horaria",
          searchPlaceholder: "Escribe para buscar...",
          selected: "Zona horaria seleccionada"
        },
        tabs: {
          weekly: "Horarios Semanales",
          overrides: "Excepciones y Feriados"
        },
        weekly: {
          title: "Horarios de Atención Semanales",
          description:
            "Configure los horarios regulares de atención para cada día de la semana.",
          rule: "Regla",
          days: "Días de la Semana",
          hours: "Horarios",
          closedMessage: "Cerrado (sin horarios definidos)",
          addHour: "Añadir Horario",
          addRule: "Añadir Nueva Regla Semanal",
          from: "Desde",
          to: "Hasta",
          until: "hasta"
        },
        overrides: {
          title: "Excepciones y Feriados",
          description:
            "Configure fechas específicas con horarios especiales o cierres (feriados, eventos, etc.).",
          exception: "Excepción",
          date: "Fecha",
          label: "Descripción",
          labelPlaceholder: "Ej: Navidad, Carnaval...",
          repeat: "Repetición",
          repeatNone: "No repetir",
          repeatYearly: "Anual",
          closedDay: "Cerrado en este día",
          specialHours: "Horarios Especiales",
          addHour: "Añadir Horario",
          addException: "Añadir Excepción o Feriado",
          from: "Desde",
          to: "Hasta",
          until: "hasta"
        },
        days: {
          mon: "Lunes",
          tue: "Martes",
          wed: "Miércoles",
          thu: "Jueves",
          fri: "Viernes",
          sat: "Sábado",
          sun: "Domingo"
        }
      }
    }
  }
};

export { messages };
