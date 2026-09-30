const messages = {
  es: {
    translations: {
      paywall: {
        changeTitle: "¿Cambiamos de plan?",
        changeText:
          "Sube o baja cuando quieras. La mejora se paga ahora; al bajar no se cobra nada hoy — el próximo cobro ya viene con el nuevo valor.",
        currentBadge: "TU PLAN ACTUAL",
        upgradeBadge: "MEJORA ↑",
        downgradeBadge: "BAJA ↓",
        currentBtn: "Plan actual",
        upgradeBtn: "Mejorar plan",
        downgradeBtn: "Cambiar a este plan",
        changedTitle: "¡Plan cambiado!",
        changedText:
          "Ahora estás en {{plan}}. El próximo cobro, el {{date}}, ya viene con el nuevo valor.",
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
      network: {
        reconnected: "Conectado de nuevo",
        server: "El servidor no responde, reintentando…",
        reconnecting: "Reconectando…",
        sending: "Enviando archivo…",
        loading: "Cargando…",
        slow: "Conexión lenta",
        backOnline: "Internet de vuelta 🎉",
        offlineTitle: "Tu internet salió a tomar un café",
        offlineText:
          "Le silbamos al router y no contestó. En cuanto vuelva, seguimos justo donde lo dejaste.",
        retry: "Intentar de nuevo"
      },
      payment: {
        cardPreview: {
          holder: "Titular",
          holderPlaceholder: "Nombre en la tarjeta",
          expiry: "Vence",
          ccv: "Código de seguridad"
        },
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
          connections: "Bandeja de entrada",
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
        connections: "Bandeja de entrada",
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
        connections: "Bandeja de entrada",
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
        changePlan: "Cambiar plan",
        pageTitle: "Mi Suscripción",
        pageSubtitle: "Administra tu plan, pago e historial en un solo lugar.",
        currentPlan: "Suscripción actual",
        planBenefits: "Beneficios del plan",
        noPlan: "Sin plan",
        valuePaid: "Valor pagado",
        planValue: "Valor del plan",
        expiresOn: "Vence el",
        expiredOn: "Venció el",
        upgradeTitle: "Mejora tu plan a",
        upgradeText:
          "Con la mejora pasas a {{users}} usuarios y {{connections}} conexiones y desbloqueas nuevas funciones para tu operación.",
        upgradeBtn: "Mejorar plan",
        historyTitle: "Historial de pagos",
        seeAll: "Ver todo",
        seeLess: "Ver menos",
        statusPaid: "Aprobado",
        renewalTitle: "Renovación",
        cardActive: "Activo",
        cardPaused: "En pausa",
        cardExpires: "Vence {{date}}",
        cardSaved: "Tarjeta guardada",
        cardMenu: "Opciones de la tarjeta",
        cardRemove: "Eliminar tarjeta",
        cardRemoveConfirm:
          "¿Eliminar la tarjeta guardada? La renovación automática deja de funcionar hasta que guardes otra tarjeta.",
        autoRenewOn: "Renovación automática activada",
        autoRenewOff: "Renovación automática desactivada",
        cardNote: "Esta tarjeta se usa para renovar tu suscripción actual.",
        noCard: "Ninguna tarjeta guardada",
        noCardNote:
          'Al pagar con tarjeta, marca "Guardar tarjeta" para renovar automáticamente.',
        addCard: "Agregar tarjeta",
        addressTitle: "Dirección",
        addressUpdate: "Actualizar dirección",
        addressEmpty: "Ninguna dirección registrada.",
        addressNumber: "n.º {{number}}",
        alertOpen: "Factura de {{value}} pendiente",
        plansDialogTitle: "Planes y beneficios",
        close: "Cerrar",
        address: {
          title: "Dirección de facturación",
          postalCode: "Código postal",
          street: "Calle",
          number: "Número",
          complement: "Complemento",
          district: "Barrio",
          city: "Ciudad",
          state: "Estado",
          save: "Guardar",
          cancel: "Cancelar",
          saved: "Dirección actualizada",
          cepNotFound: "Código postal no encontrado"
        },
        plansTitle: "Planes",
        perMonth: "/mes",
        planUsers: "{{count}} usuario",
        planUsers_plural: "{{count}} usuarios",
        planConnections: "{{count}} conexión",
        planConnections_plural: "{{count}} conexiones",
        planQueues: "{{count}} fila",
        planQueues_plural: "{{count}} filas",
        planChat: "Chat interno",
        planSchedules: "Programaciones",
        planApi: "API de integración",
        planCurrent: "TU PLAN",
        planYours: "Plan actual",
        planChoose: "Elegir este plan",
        planChoosing: "Preparando…",
        methodsTitle: "Formas de pago",
        methodPix: "Pix",
        methodCard: "Tarjeta de crédito",
        methodBoleto: "Boleto",
        savedCardHint: "Cobro automático todos los meses en esta tarjeta.",
        savedCardRemove: "Quitar",
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
        text: "vuup.me está pensado para usarse en vertical. Gira el dispositivo para continuar."
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
        connections: "Bandeja de entrada",
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
      forgotPassword: {
        heading: "¿Olvidaste tu contraseña?",
        subheading:
          "Ingresa tu correo y te enviaremos un enlace para crear una contraseña nueva.",
        email: "Correo",
        submit: "Enviar enlace",
        sentHeading: "Revisa tu correo",
        sent: "Si existe una cuenta con {{email}}, recibirás un enlace para crear una contraseña nueva. Es válido por 30 minutos.",
        back: "Volver al inicio de sesión"
      },
      resetPassword: {
        heading: "Crea una contraseña nueva",
        subheading: "Usa al menos 6 caracteres.",
        password: "Nueva contraseña",
        confirm: "Repite la nueva contraseña",
        submit: "Guardar contraseña",
        mismatch: "Las contraseñas no coinciden.",
        success: "Contraseña cambiada. Inicia sesión con la nueva.",
        invalid: "Este enlace no es válido. Solicita uno nuevo.",
        requestNew: "Solicitar un enlace nuevo"
      },
      login: {
        forgot: "Olvidé mi contraseña",
        code: {
          heading: "Confirma que eres tú",
          subheading:
            "Enviamos un código de 6 dígitos a {{email}}. Es válido por 10 minutos.",
          label: "Código",
          submit: "Confirmar",
          resend: "Reenviar código",
          resendIn: "Reenviar en {{seconds}}s",
          resent: "Enviamos un código nuevo.",
          back: "Volver",
          hint: "Después de esto, este navegador quedará autorizado."
        },
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
        title: "Bandejas de entrada",
        toasts: {
          deleted: "Conexión con WhatsApp eliminada con éxito"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? Esta acción no se puede deshacer.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "¿Estás seguro? Tendrás que escanear el código QR de nuevo para reconectar. Nada se borra en WhatsApp.",
          purge:
            "Borrar todo lo de esta conexión del sistema: atenciones, mensajes, archivos y los contactos que solo hablaron por ella. No se puede deshacer.",
          purgeOnDelete: "Eliminar todas las conversaciones de la conexión",
          purgeOnDeleteHint:
            "Atenciones, mensajes, archivos y los contactos que solo hablaron por ella. No se puede deshacer.",
          closeTickets: "Cerrar todas las atenciones de esta conexión"
        },
        buttons: {
          add: "Añadir bandeja de entrada",
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
        draft: "Borrador",
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
        hintQueue:
          'Sin agente, la atención vuelve a "En espera" de la cola elegida.',
        hintUser: "Va directo a {{name}}, ya en atención.",
        userLabel: "Agente (opcional)",
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
        tree: {
          devPipeline: "Pipeline de IA",
          conversations: "Conversaciones",
          all: "Todas las conversaciones",
          pending: "Sin atender",
          closed: "Resueltas",
          groups: "Grupos",
          channels: "Canales",
          queues: "Colas",
          noChannels: "Ninguna bandeja de entrada",
          noQueues: "Ninguna cola",
          settings: "Configuración",
          general: "General",
          compose: "Nueva conversación",
          offline: "Desconectada",
          inboxFilter: "Bandeja"
        },
        sections: {
          service: "Atención",
          audience: "Contactos",
          management: "Gestión",
          system: "Sistema"
        },
        listItems: {
          devPipeline: "Pipeline de IA",
          super: "Super admin",
          dashboard: "Tablero",
          connections: "Bandeja de entrada",
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
        searchEmoji: "Buscar emoji",
        recent: "Recientes",
        frequent: "Más usados",
        emojiResults: "Resultados",
        noEmoji: "No se encontraron emojis",
        emojiCategories: {
          people: "Caras y personas",
          nature: "Animales y naturaleza",
          foods: "Comida y bebida",
          activity: "Actividades",
          places: "Viajes y lugares",
          objects: "Objetos",
          symbols: "Símbolos",
          flags: "Banderas"
        },
        title: "Emoji, stickers y GIFs",
        emoji: "Emoji",
        stickers: "Stickers",
        gifs: "GIFs",
        searchGifs: "Buscar GIFs",
        noStickers:
          "Los stickers que lleguen en las conversaciones aparecen aquí para reenviarlos.",
        noGifs: "No se encontraron GIFs.",
        gifsNotConfigured:
          "Los GIFs todavía no están configurados: el administrador del sistema agrega la clave de KLIPY en Configuración > Opciones > Integraciones.",
        sendSticker: "Enviar sticker",
        sendGif: "Enviar GIF"
      },
      about: {
        headline: "Hecha para atender mejor, todos los días",
        product:
          "vuup.me es una plataforma de atención por WhatsApp que reúne a tu equipo en un solo lugar: conversaciones, colas, chatbot, Kanban y chat interno.",
        founder:
          "Soy David Fernandes, tengo 22 años y emprendo en el área de la tecnología.",
        improving:
          "Siempre estoy mejorando vuup.me: cada actualización trae ajustes y novedades para que el día a día de quien atiende sea más simple.",
        founderRole: "Fundador de vuup.me",
        license: "Software libre bajo la licencia AGPL-3.0.",
        sourceCode: "Código fuente",
        aboutthe: "Acerca de",
        copyright: "© 2024 - Funcionando com vuup.me",
        buttonclose: "Cerrar",
        title: "Acerca de vuup.me",
        abouttitle: "Origen y Mejoras",
        aboutdetail:
          "vuup.me es derivado indirecto del proyecto Whaticket con mejoras compartidas por los desarrolladores del sistema EquipeChat a través del canal VemFazer en YouTube, posteriormente mejorado por Claudemir Todo Bom.",
        aboutauthorsite: "Sitio del autor",
        aboutwhaticketsite: "Sitio de la Comunidad Whaticket en Github",
        aboutvemfazersite: "Sitio del canal Vem Fazer en Github",
        licenseheading: "Licencia de Código Abierto",
        licensedetail:
          "vuup.me está licenciado bajo la Licencia Pública General Affero de GNU versión 3, lo que significa que cualquier usuario que tenga acceso a esta aplicación tiene derecho a obtener acceso al código fuente. Más información en los siguientes enlaces:",
        licensefulltext: "Texto completo de la licencia",
        licensesourcecode: "Código fuente de vuup.me"
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
      devPipeline: {
        difficulty: {
          easy: "Fácil",
          medium: "Media",
          hard: "Difícil"
        },
        devices: {
          desktop: "Computadora",
          mobile: "Celular"
        },
        testActions: {
          goto: "Abrir",
          click: "Hacer clic en",
          fill: "Completar",
          press: "Tecla",
          wait: "Esperar",
          scroll: "Desplazar",
          screenshot: "Foto"
        },
        agentBios: {
          triage:
            "Curiosa, hurga en el código hasta encontrar dónde vive el problema. Escribe poco y va al grano: reescribe el pedido, señala los archivos y dice si es fácil o difícil.",
          priority:
            "Decide qué es urgente de verdad, sin falsas alarmas. Trabaja junto a Xereta, en la misma llamada.",
          developer:
            "Dev pragmático: hace el cambio más pequeño que resuelve y no deja cabos sueltos. En las solicitudes difíciles, entra con el modelo más potente.",
          reviewer:
            "Revisora exigente y justa: mira cada línea con lupa, pero solo frena lo que es un problema de verdad.",
          tester:
            "El fotógrafo del equipo: después del merge, abre el sistema en producción, graba video y toma fotos en computadora y celular para demostrar que funciona.",
          learner:
            "El profesor del equipo: convierte cada tropiezo en una lección corta que los otros agentes no olvidan."
        },
        team: {
          intro:
            "Cada agente usa el modelo que su tarea necesita, a través de OpenRouter. El modelo caro solo entra cuando el triaje dice que la solicitud es media o difícil.",
          price: "{{input}} entrada · {{output}} salida, por millón de tokens",
          sameCall:
            "Decide junto a Xereta, en la misma llamada: no cuesta nada extra.",
          routingTitle: "Quién escribe y quién revisa, según la dificultad",
          difficulty: "Dificultad",
          routingHint:
            "Riesgo alto (dinero, datos, login o envío de mensajes) cuenta como difícil. Si un modelo se cae, OpenRouter usa el de reserva solo."
        },
        slots: {
          triage: "Siempre",
          developer: "Solicitud fácil",
          developerHard: "Media o difícil",
          reviewer: "Fácil o media",
          reviewerHard: "Difícil o riesgosa",
          tester: "Siempre",
          learner: "Siempre"
        },
        title: "Pipeline de IA",
        subtitle:
          "Mejoras y correcciones hechas por agentes de IA: triaje, código, code review, PR y pruebas. Apruebas antes del código y revisas el PR antes del merge.",
        newTask: "Nueva solicitud",
        search: "Buscar por título, empresa o #número",
        showCancelled: "Mostrar canceladas",
        summary: "{{waiting}} esperándote · {{running}} en ejecución",
        empty: "Nada por aquí",
        showAll: "Ver todas ({{count}})",
        tokens: "{{count}} tokens",
        tokensDetail:
          "{{input}} de entrada · {{output}} de salida · {{cached}} de caché",
        round: "Ronda {{count}}",
        effort: "Esfuerzo {{value}}",
        stages: {
          tests: "Pruebas",
          intake: "Inicio",
          prioritization: "Priorización",
          development: "Desarrollo",
          review: "Code review",
          pr: "PR",
          done: "Terminado",
          cancelled: "Canceladas"
        },
        stageHints: {
          tests:
            "Después del merge, Clique prueba en pantalla con fotos y video",
          intake:
            "El agente entiende el pedido, consulta el código y reescribe la tarea",
          prioritization: "Revisas la prioridad y apruebas antes del código",
          development: "El agente desarrollador escribe el código",
          review: "El agente revisor revisa el diff y pide ajustes",
          pr: "Branch y PR listos para que los revises",
          done: "Probada en pantalla o terminada por ti",
          cancelled: "Solicitudes que no seguirán"
        },
        line: {
          testsWaiting: "Esperando la nueva versión en producción",
          testsFailed: "La prueba en pantalla falló",
          testsUnclear: "La prueba no pudo confirmarlo",
          queued: "En cola",
          running: {
            tests: "Clique probando en pantalla",
            intake: "Xereta analizando el pedido",
            prioritization: "Preparando el desarrollo",
            development: "Zé Commit escribiendo el código",
            review: "Dona Lupa revisando el diff",
            pr: "Abriendo el PR"
          },
          notAnalyzed: "Esperando análisis",
          questions: "El agente tiene preguntas para ti",
          approve: "Aprueba para desarrollar",
          stuck: "El revisor necesita una decisión tuya",
          pr: "PR #{{number}} abierto",
          patch: "Patch listo para descargar",
          done: "Terminada",
          cancelled: "Cancelada"
        },
        hints: {
          testsWaiting:
            "El PR fue aceptado. Cuando suba la nueva versión (actualización del stack), Clique prueba solo. Si ya está en producción, ejecútala ahora.",
          testsFailed:
            "Mira las fotos en la conversación. Para corregir, escribe abajo y haz clic en “Enviar a los agentes”: lo que vio Clique va junto.",
          testsUnclear:
            "Clique no pudo ver el resultado (el motivo está en la conversación). Ejecútala de nuevo o termina.",
          running:
            "Los agentes están trabajando; la conversación se actualiza sola.",
          error:
            "Mira el error en la conversación, corrige lo que falte e inténtalo de nuevo.",
          notAnalyzed:
            "Pedido de cliente: el análisis solo empieza cuando tú lo indiques.",
          questions:
            "Responde en la caja de abajo y haz clic en “Enviar a los agentes”.",
          approve:
            "Revisa la especificación, ajusta la prioridad si hace falta y aprueba.",
          stuck: "Publica así, pide otra ronda comentando abajo o cancela.",
          pr: "Revisa y prueba antes del merge. Para pedir ajustes, comenta abajo.",
          patch:
            "Sin token de GitHub: aplica el patch con git apply. Para pedir ajustes, comenta abajo."
        },
        priority: {
          urgent: "Urgente",
          high: "Alta",
          normal: "Normal",
          low: "Baja"
        },
        kind: {
          bug: "Bug",
          feature: "Funcionalidad",
          improvement: "Mejora",
          chore: "Mantenimiento"
        },
        risk: {
          low: "Riesgo bajo",
          medium: "Riesgo medio",
          high: "Riesgo alto"
        },
        severity: {
          blocker: "Bloquea",
          major: "Importante",
          minor: "Detalle"
        },
        source: {
          admin: "Tú",
          help: "Cliente"
        },
        agents: {
          tester: "Clique",
          triage: "Chismoso",
          priority: "Sirena",
          developer: "Pepe Commit",
          reviewer: "Doña Lupa",
          learner: "Sabelotodo",
          system: "Engranaje",
          human: "Tú"
        },
        tabs: {
          team: "Equipo",
          board: "Tablero",
          skills: "Skills",
          conversation: "Conversación",
          spec: "Especificación",
          code: "Código"
        },
        events: {
          test: "pidió ejecutar las pruebas en pantalla",
          testPlan: "planeó la prueba en pantalla",
          testNotNeeded: "vio que este cambio no aparece en pantalla",
          testRun: "grabó la prueba: {{count}} foto(s)",
          testSkip: "omitió la prueba en pantalla",
          testChecks: "Lo que las fotos deben mostrar",
          testSteps: "Guion",
          testFailedSteps: "Pasos que fallaron",
          testPageErrors: "Errores de JavaScript en pantalla",
          testSafe:
            "Navegador de solo lectura: {{count}} intento(s) de guardar bloqueado(s); nada en el sistema fue modificado.",
          testOk: "OK",
          testNotOk: "No",
          testResult: {
            pass: "aprobó en pantalla",
            fail: "falló en pantalla",
            unclear: "no pudo confirmarlo"
          },
          testSkipReason: {
            no_browser:
              "El navegador de pruebas no está configurado (PLAYWRIGHT_WS_ENDPOINT)."
          },
          searched: "Buscó en el código",
          learned: "aprendió {{count}} skill(s)",
          learnedNothing:
            "estudió la solicitud y no encontró nada nuevo que aprender",
          request: "abrió el pedido",
          readTriage: "consultó el código",
          read: "leyó",
          spec: "reescribió la tarea",
          question: "necesita respuestas",
          questionHint: "Responde abajo y haz clic en “Enviar a los agentes”.",
          priority: "sugirió prioridad {{priority}}",
          edits: "modificó {{count}} archivo(s)",
          editErrors: "Ediciones que no se aplicaron",
          checks: "Errores de sintaxis",
          notes: "Notas",
          approved: "aprobó el código",
          changes: "pidió ajustes",
          stage: "Pasó a {{stage}}",
          error: "la etapa falló",
          pr: "abrió el PR #{{number}} (borrador)",
          patch: "dejó el patch listo",
          patchReason: {
            local:
              "Modo de prueba: el código vino de esta máquina, así que no se abre ningún PR.",
            no_token:
              "Sin token de GitHub: descarga el patch y aplícalo con git apply."
          },
          stuckTitle: "te necesita",
          stuck:
            "El revisor sigue pidiendo ajustes después de {{count}} ronda(s). Tú decides: publicar así, pedir otra ronda o cancelar.",
          merged: "PR #{{number}} fusionado",
          approve: "aprobó para desarrollo ({{priority}})",
          publish: "decidió publicar de todos modos",
          done: "marcó como terminada",
          cancel: "canceló la solicitud",
          comment: "comentó",
          rerun: "envió a los agentes"
        },
        actions: {
          testNow: "Ejecutar pruebas ahora",
          testAgain: "Ejecutar de nuevo",
          doneAnyway: "Terminar de todos modos",
          doneWithoutTests: "Terminar sin probar",
          learn: "Aprender de esta solicitud",
          approve: "Aprobar y desarrollar",
          analyze: "Analizar ahora",
          retry: "Intentar de nuevo",
          publish: "Publicar de todos modos",
          done: "Terminar",
          cancel: "Cancelar solicitud",
          delete: "Eliminar",
          openPr: "Abrir PR",
          download: "Descargar patch",
          comment: "Solo comentar",
          rerun: "Enviar a los agentes",
          save: "Guardar",
          edit: "Editar",
          close: "Cerrar",
          more: "Más opciones"
        },
        composer: {
          placeholder: "Escribe a los agentes o deja una nota…",
          hint: "“Enviar a los agentes” manda esto {{target}}.",
          toTriage: "al triaje para rehacer el análisis",
          toDeveloper: "al desarrollador para ajustar el código",
          busy: "Los agentes están trabajando: puedes comentar, y el envío espera a que terminen."
        },
        spec: {
          skills: "Skills usadas",
          task: "Tarea",
          title: "Título",
          spec: "Especificación",
          acceptance: "Criterios de aceptación",
          acceptanceHint: "Un criterio por línea",
          files: "Archivos involucrados",
          priorityReason: "Por qué esta prioridad",
          original: "Pedido original",
          empty: "El triaje todavía no se ejecutó",
          emptyHint: "Cuando se ejecute, la tarea reescrita aparece aquí."
        },
        code: {
          empty: "Todavía no hay código",
          emptyHint: "El diff aparece aquí cuando el desarrollador termine.",
          ops: {
            create: "nuevo",
            edit: "modificado",
            delete: "eliminado"
          }
        },
        new: {
          title: "Nueva solicitud",
          subtitle:
            "El agente de triaje consulta el código y reescribe la tarea antes de cualquier línea de código.",
          name: "Título",
          description: "Qué hay que hacer",
          descriptionHint:
            "Descríbelo como se lo contarías a alguien del equipo: dónde pasa y qué debería pasar.",
          priority: "Prioridad inicial",
          create: "Crear y analizar"
        },
        setup: {
          perAgent: "OpenRouter · un modelo por agente",
          seeTeam: "ver el equipo",
          open: "Abrir configuración",
          noKey:
            "Falta la clave de OpenRouter: OPENROUTER_API_KEY en el stack.",
          noRepo: "Falta el repositorio de GitHub.",
          local:
            "Modo de prueba: leyendo el código de esta máquina (queda como patch, sin PR)",
          readOnly:
            "{{repo}} sin token: lee el código y el resultado queda como patch",
          github: "PRs en {{repo}}"
        },
        confirm: {
          cancel: "¿Cancelar esta solicitud?",
          cancelText:
            "Los agentes se detienen antes de la próxima llamada. Si vino de un cliente, se le avisa en Ayuda.",
          delete: "¿Eliminar esta solicitud?",
          deleteText:
            "La conversación de los agentes y el código generado se borran para siempre."
        },
        toasts: {
          testing: "Clique está probando en pantalla",
          learning: "Sabelotodo está estudiando esta solicitud",
          created: "Solicitud #{{id}} creada: el triaje empezó",
          approved: "Aprobada: el desarrollo empezó",
          sent: "Enviado a los agentes"
        },
        agentRoles: {
          tester: "pruebas",
          triage: "triaje",
          priority: "prioridad",
          developer: "código",
          reviewer: "revisión",
          learner: "aprendizaje"
        },
        designChip: "Interfaz",
        images: {
          title: "Imágenes",
          drop: "Arrastra imágenes, pega una captura (Ctrl+V) o toca para elegir. La IA las ve.",
          attach: "Adjuntar imagen",
          remove: "Quitar imagen",
          tooBig: "{{name}} supera los 8 MB",
          limit: "Como máximo {{count}} imágenes"
        },
        stats: {
          title: "Resumen",
          done: "Terminadas",
          doneHint: "de {{total}} solicitudes",
          open: "Pendientes",
          openHint: "{{count}} esperando aprobación",
          spent: "Gasto total",
          spentHint: "{{tokens}} tokens de IA",
          average: "Media por terminada",
          averageHint: "costo de IA por solicitud lista",
          weeksTitle: "Últimas 8 semanas",
          weeksHint: "Solicitudes creadas y terminadas por semana, y el gasto",
          created: "Creadas",
          doneLegend: "Terminadas",
          spentLegend: "Gasto (R$)",
          weekOf: "Semana del {{date}}",
          createdCount: "{{count}} creada(s)",
          doneCount: "{{count}} terminada(s)",
          openersTitle: "Quién abrió",
          openersHint: "{{team}} por el equipo · {{help}} por clientes",
          team: "Equipo (super)",
          teamTitle: "El equipo de agentes"
        },
        skills: {
          intro:
            "Lo que los agentes saben del proyecto. Cada tarea usa solo las skills que elige el triaje. Enseña con tus palabras o deja que Sabelotodo aprenda de las correcciones.",
          teach: "Enseñar",
          new: "Nueva skill",
          teachTitle: "Enseñar a los agentes",
          teachHint:
            "Escríbelo a tu manera: una regla, una preferencia de diseño, cómo funciona una parte del sistema. La IA lo organiza en una skill (o mejora una existente).",
          teachPlaceholder:
            "Ej.: En las pantallas de configuración, el botón de guardar va siempre en el pie, alineado a la derecha. En el celular ocupa todo el ancho.",
          teachSend: "Organizar en skill",
          teaching: "Organizando…",
          editTitle: "Editar skill",
          newTitle: "Nueva skill",
          fields: {
            name: "Nombre",
            description: "Cuándo usarla",
            descriptionHint:
              "Una frase: con ella el triaje decide si la skill sirve para la tarea.",
            content: "Contenido",
            contentHint:
              "Puntos cortos y directos. Todo esto va al agente cuando se usa la skill."
          },
          filters: {
            active: "En uso",
            proposed: "Propuestas",
            archived: "Archivadas"
          },
          search: "Buscar skill",
          empty: {
            active: "Ninguna skill en uso",
            proposed: "Ninguna propuesta esperándote",
            archived: "Nada archivado"
          },
          emptyHint:
            "Enseña algo nuevo o deja que Sabelotodo aprenda de las próximas solicitudes.",
          status: {
            active: "En uso",
            proposed: "Propuesta",
            archived: "Archivada"
          },
          source: {
            seed: "Estándar",
            human: "Tú",
            agentFrom: "{{name}} · #{{id}}"
          },
          replaces: "Nueva versión de “{{name}}”",
          newProposal: "Skill nueva",
          uses: "usada {{count}} vez(ces)",
          lastUsed: "última el {{date}}",
          more: "Ver todo",
          less: "Ver menos",
          showOld: "Ver versión actual",
          showNew: "Ver propuesta",
          approve: "Aprobar",
          discard: "Descartar",
          archive: "Archivar",
          restore: "Reactivar",
          confirmDiscard: "¿Descartar esta propuesta?",
          confirmDelete: "¿Eliminar esta skill?",
          toasts: {
            approve: "Skill aprobada: los agentes ya la usan",
            archive: "Skill archivada",
            restore: "Skill de vuelta en uso",
            delete: "Skill eliminada",
            discard: "Propuesta descartada",
            saved: "Skill guardada",
            taught: "Aprendido: “{{name}}”"
          }
        },
        errors: {
          ERR_DEV_AI_CREDITS:
            "Se acabó el crédito de OpenRouter (o el límite de la clave): recarga en openrouter.ai",
          ERR_DEV_AI_TIMEOUT:
            "La IA tardó demasiado en responder: inténtalo de nuevo",
          ERR_DEV_TEST_NO_BROWSER:
            "El navegador de pruebas no está configurado",
          ERR_DEV_TEST_NO_URL:
            "Falta la dirección del sistema (FRONTEND_URL) para la prueba",
          ERR_DEV_TEST_NO_USER:
            "No hay un super admin activo para que la prueba entre",
          ERR_DEV_TEST_BROWSER: "El navegador de pruebas no respondió",
          ERR_DEV_AI_NOT_CONFIGURED:
            "Falta la clave de OpenRouter (variable OPENROUTER_API_KEY en el stack)",
          ERR_DEV_AI_AUTH: "La clave de la IA fue rechazada",
          ERR_DEV_AI_MODEL:
            "El modelo elegido no existe o no está habilitado para esta clave",
          ERR_DEV_AI_RATE_LIMIT:
            "Límite de uso de la IA alcanzado: inténtalo en un rato",
          ERR_DEV_AI_OFFLINE: "Sin conexión con la IA",
          ERR_DEV_AI_REFUSAL: "La IA rechazó el pedido",
          ERR_DEV_AI_TRUNCATED:
            "La respuesta de la IA fue demasiado larga y se cortó",
          ERR_DEV_AI_FORMAT: "La IA respondió fuera del formato acordado",
          ERR_DEV_AI_FAILED: "La IA devolvió un error",
          ERR_DEV_NO_REPO: "No hay ningún repositorio configurado",
          ERR_DEV_GITHUB_AUTH: "El token de GitHub fue rechazado",
          ERR_DEV_GITHUB_PERMISSION:
            "El token de GitHub lee el repositorio, pero no puede escribir en él. Crea el token con la organización dueña del repositorio como Resource owner y dale Contents y Pull requests en lectura y escritura",
          ERR_DEV_GITHUB_FORBIDDEN:
            "El token de GitHub no tiene permiso para esto",
          ERR_DEV_GITHUB_NOT_FOUND:
            "Repositorio o branch no encontrado en GitHub",
          ERR_DEV_GITHUB_RATE_LIMIT:
            "Límite de uso de GitHub alcanzado: configura un token o espera una hora",
          ERR_DEV_GITHUB_NO_TOKEN: "Falta el token de GitHub para abrir el PR",
          ERR_DEV_GITHUB_FAILED: "GitHub devolvió un error",
          ERR_DEV_NO_CHANGES: "El desarrollador no modificó ningún archivo",
          ERR_DEV_TOO_BIG:
            "Cambio demasiado grande para la revisión automática: divide la solicitud",
          ERR_DEV_TOKEN_LIMIT: "La solicitud llegó al límite de tokens",
          ERR_DEV_FAILED: "Error inesperado"
        }
      },
      settings: {
        options: {
          nav: "Secciones de opciones",
          sections: {
            devPipeline: {
              title: "Pipeline de IA",
              description:
                "Agentes que analizan pedidos de mejora, escriben el código, lo revisan, abren un PR en GitHub y lo prueban en pantalla después del merge. Vale para toda la instalación."
            },
            service: {
              title: "Atención",
              description:
                "Mensajes automáticos y lo que pasa cuando una conversación se acepta, se transfiere, se cierra o se reabre."
            },
            automation: {
              title: "Chatbot y automatizaciones",
              description:
                "El menú automático que recibe al cliente y lo que el sistema hace solo con las conversaciones detenidas."
            },
            hours: {
              title: "Horario de atención",
              description:
                "En qué horario atiende la empresa y qué hacer con los mensajes que llegan fuera de él."
            },
            chat: {
              title: "Conversaciones",
              description:
                "Lo que el equipo ve y usa en la pantalla de conversación: historial, respuestas rápidas, llamadas y grupos."
            },
            ai: {
              title: "Inteligencia artificial",
              description:
                "Proveedores y claves de la transcripción de audios y del asistente de IA de las colas."
            },
            integrations: {
              title: "Integraciones",
              description:
                "Claves para que otros sistemas y servicios trabajen junto con vuup.me."
            },
            files: {
              title: "Archivos",
              description:
                "Tamaño máximo de los archivos enviados y recibidos por las conexiones. Vale para todas las empresas."
            },
            system: {
              title: "Sistema",
              description:
                "Opciones de toda la instalación. Valen para todas las empresas."
            }
          },
          devKey: {
            ok: "Configurada",
            missing: "No encontrada"
          },
          groups: {
            devAi: "Inteligencia artificial",
            devAiHint:
              "Los agentes usan OpenRouter, cada uno con el modelo de su tarea, definidos por el sistema (la pestaña Equipo del Pipeline de IA muestra quién usa cuál). El contexto del proyecto queda en caché entre llamadas.",
            devRepo: "Repositorio (GitHub)",
            devRepoHint:
              "De dónde se lee el código y dónde se abre el PR. Sin token, el código se lee (si el repositorio es público) y el resultado queda como un patch para descargar.",
            devRules: "Reglas del pipeline",
            autoMessages: "Mensajes automáticos",
            closing: "Cierre",
            rating: "Encuesta de satisfacción",
            tags: "Etiquetas",
            chatbot: "Chatbot",
            idle: "Conversaciones detenidas",
            idleHint:
              "Elige después de cuánto tiempo el sistema actúa solo. Deja 0 para no hacer nada.",
            chatScreen: "Pantalla de conversación",
            calls: "Llamadas",
            groups: "Grupos de WhatsApp",
            transcription: "Transcripción de audios",
            agent: "Asistente de IA de las colas",
            agentHint:
              "Lo usan las colas con el Asistente de IA activado (Filas y Chatbot › editar cola), la recepción inteligente y el asistente dentro de la conversación. Es independiente de la clave de transcripción.",
            api: "API",
            media: "GIFs y stickers",
            limits: "Límites de tamaño",
            access: "Idioma, registro y cobro",
            server: "Servidor"
          },
          units: {
            tokens: "tokens",
            minutes: "min",
            days: "días",
            megabytes: "MB"
          },
          timeout: {
            after: "Después de",
            then: "El sistema va a",
            close: "Cerrar la conversación",
            transferTo: "Enviar a la cola {{queue}}"
          },
          variables: {
            title: "Puedes usar:",
            firstname: "nombre del cliente",
            name: "nombre completo",
            greeting: "buenos días, buenas tardes o buenas noches",
            user: "nombre del agente",
            queue: "nombre de la cola",
            protocol: "número de protocolo"
          },
          notes: {
            needsRating: "Activa la evaluación para usarlo.",
            needsSchedule: "Activa el control de horario para usarlo.",
            groupsIgnored:
              "Disponible cuando los mensajes de grupos no se ignoran.",
            scheduleCompany:
              "Los horarios están en la pestaña Horarios, aquí en Configuración.",
            scheduleQueue:
              "Los horarios de cada cola están en Filas y Chatbot, al editar la cola."
          },
          apiToken: {
            generate: "Generar token",
            copy: "Copiar",
            remove: "Borrar",
            empty: "Ningún token generado"
          },
          fields: {
            devOpenRouterKey: {
              title: "Clave de OpenRouter",
              description:
                "Viene de la variable OPENROUTER_API_KEY del stack, junto con las demás. No se guarda aquí."
            },
            _devAutoLearn: {
              title: "Aprender solo",
              description:
                "Sabelotodo estudia las correcciones de cada solicitud (tus comentarios, lo que el revisor bloqueó, ediciones que fallaron) y crea o mejora skills. Encendido, entran en uso de inmediato; apagado, esperan tu aprobación en la pestaña Skills. Lo que viene de pedidos de clientes siempre espera."
            },
            _devUsdBrl: {
              title: "Cotización del dólar (R$)",
              description:
                "Para mostrar el costo en reales. En blanco, usa la cotización del día, actualizada cada 12 horas."
            },
            _devGithubRepo: {
              title: "Repositorio",
              description:
                "dueño/nombre, como aparece en la dirección de GitHub."
            },
            _devGithubToken: {
              title: "Token de GitHub",
              description:
                "Token fine-grained. En Resource owner elige al dueño del repositorio (si es una organización, la organización, no tu cuenta), acceso solo a este repositorio y Contents y Pull requests en lectura y escritura. Si la organización lo exige, aprueba el token en Settings › Personal access tokens. Los agentes nunca hacen merge: el PR sale como borrador."
            },
            _devGithubBranch: {
              title: "Branch base",
              description:
                "De dónde se lee el código y hacia dónde apunta el PR."
            },
            _devAutoApprove: {
              title: "Desarrollar sin aprobación",
              description:
                "Apagado (recomendado), la solicitud espera en Priorización hasta que apruebes: no se gasta ningún token de código sin que veas la especificación."
            },
            _devAutoTriage: {
              title: "Analizar sugerencias de clientes automáticamente",
              description:
                "Las sugerencias abiertas en Ayuda entran al tablero. Encendido, el triaje se ejecuta enseguida; apagado, espera a que hagas clic en Analizar."
            },
            _devReviewRounds: {
              title: "Rondas de ajuste",
              description:
                "Cuántas veces el revisor puede devolver el código al desarrollador antes de pedir tu decisión."
            },
            _devTokenLimit: {
              title: "Límite de tokens por solicitud",
              description:
                "Tope de seguridad: la solicitud se detiene con error al superarlo. La lectura de caché no cuenta."
            },
            ticketAcceptedMessage: {
              title: "Al aceptar la conversación",
              description:
                "Se envía al cliente cuando un agente asume la conversación. En blanco, no se envía nada.",
              placeholder:
                "Ej.: ¡{{greeting}}, {{firstname}}! Soy {{user}} y voy a continuar tu atención."
            },
            transferMessage: {
              title: "Al transferir a otra cola",
              description:
                "Se envía al cliente cuando la conversación cambia de cola. Si la conexión tiene su propio mensaje de transferencia, se usa ese. En blanco, no se envía nada.",
              placeholder:
                "Ej.: {{firstname}}, te paso con el equipo de {{queue}}. ¡En breve alguien te responde!"
            },
            keepUserAndQueue: {
              title: "Mantener cola y agente al cerrar",
              description:
                "Activado: la conversación cerrada conserva la cola y el agente, y vuelve a ellos si se reabre. Desactivado: ambos se quitan al cerrar."
            },
            autoReopenTimeout: {
              title: "Reabrir conversación reciente",
              description:
                "Si el cliente vuelve a escribir dentro de este tiempo después del cierre, se reabre la misma conversación en lugar de empezar otra. 0 lo desactiva."
            },
            userRating: {
              title: "Pedir evaluación al cerrar",
              description:
                "Al cerrar la conversación, el cliente recibe un pedido para calificar la atención del 1 al 5."
            },
            ratingsTimeout: {
              title: "Plazo para evaluar",
              description:
                "Tiempo que tiene el cliente para enviar la nota. Después, el pedido vence y recibe el mensaje de cierre."
            },
            tagsMode: {
              title: "Dónde quedan las etiquetas",
              description:
                "En la conversación: valen solo para esa atención. En el contacto: acompañan a la persona en todas las conversaciones. En ambos: van a la conversación y al contacto.",
              options: {
                ticket: "En la conversación",
                contact: "En el contacto",
                both: "En ambos"
              }
            },
            chatbotAutoExit: {
              title: "Salir del chatbot con respuesta fuera del menú",
              description:
                "Activado: si el cliente escribe algo que no es una opción, la conversación sale del chatbot y pasa a un agente. Desactivado: se envía el menú de nuevo."
            },
            showNumericIcons: {
              title: "Números en emoji en el menú",
              description:
                "Muestra las opciones del chatbot como 1️⃣ 2️⃣ 3️⃣ en lugar de 1, 2, 3."
            },
            chatbotTicketTimeout: {
              title: "El cliente dejó de responder al chatbot",
              description:
                "La conversación sigue en el menú automático y el cliente ya no respondió."
            },
            noQueueTimeout: {
              title: "Conversación esperando sin cola",
              description:
                "La conversación llegó, pero todavía no entró en ninguna cola."
            },
            openTicketTimeout: {
              title: "Conversación en atención detenida",
              description:
                "Un agente asumió la conversación, pero nadie escribió nada en este tiempo."
            },
            openTicketTimeoutAction: {
              options: {
                pending: "Devolver a la cola",
                closed: "Cerrar la conversación"
              }
            },
            scheduleType: {
              title: "Control de horario",
              description:
                "Fuera del horario, el cliente recibe el mensaje de ausencia y la conversación sigue la regla de abajo.",
              options: {
                disabled: "Desactivado",
                company: "Un horario para toda la empresa",
                queue: "Un horario por cola"
              }
            },
            outOfHoursAction: {
              title: "Mensajes fuera de horario",
              description:
                "Después del aviso de ausencia, la conversación espera en la cola hasta que alguien atienda, o se cierra en el momento.",
              options: {
                pending: "Esperan en la cola",
                closed: "Se cierran"
              }
            },
            messageVisibility: {
              title: "Historial que ve el agente",
              description:
                "Para conversaciones que pasaron por más de una cola: el agente ve solo lo que se habló en sus colas, o la conversación completa.",
              options: {
                message: "Solo de sus colas",
                ticket: "La conversación completa"
              }
            },
            quickMessages: {
              title: "Respuestas rápidas",
              description:
                "Compartidas: todos ven y usan las mismas. Por usuario: cada uno ve solo las que creó.",
              options: {
                individual: "Cada usuario tiene las suyas",
                company: "Compartidas"
              }
            },
            call: {
              title: "Llamadas por WhatsApp",
              description:
                "El sistema no atiende llamadas de voz ni de video. Elige si el cliente recibe un mensaje automático pidiendo que escriba.",
              options: {
                enabled: "Solo ignorar",
                disabled: "Avisar al cliente"
              }
            },
            CheckMsgIsGroup: {
              title: "Ignorar mensajes de grupos",
              description:
                "Activado: los mensajes de grupos de WhatsApp no se convierten en conversaciones del sistema. Desactivado: cada grupo se vuelve una conversación."
            },
            groupsTab: {
              title: "Pestaña separada para grupos",
              description:
                "Muestra las conversaciones de grupos en su propia pestaña, lejos de las conversaciones con clientes."
            },
            soundGroupNotifications: {
              title: "Avisos de mensajes de grupos",
              description:
                "También reproduce el sonido y muestra la notificación cuando llega un mensaje de grupo."
            },
            audioTranscriptions: {
              title: "Transcribir audios",
              description:
                "Muestra el botón “transcribir” en los audios de la conversación. El audio solo se envía a la IA cuando alguien hace clic."
            },
            aiProvider: {
              title: "Proveedor",
              description: "Servicio que convierte el audio en texto.",
              options: {
                openai: "OpenAI",
                groq: "Groq"
              }
            },
            openAiKey: {
              title: "Clave de acceso",
              description:
                "Clave de API del proveedor elegido arriba. OpenAI: platform.openai.com › API keys. Groq: console.groq.com › API Keys."
            },
            aiAgentProvider: {
              title: "Proveedor",
              description:
                "Servicio de IA que conversa con los clientes y sugiere respuestas al equipo.",
              options: {
                openai: "OpenAI",
                gemini: "Google Gemini",
                groq: "Groq"
              }
            },
            aiAgentApiKey: {
              title: "Clave de acceso",
              description: "Clave de API del proveedor elegido arriba."
            },
            aiAgentModel: {
              title: "Modelo",
              description:
                "Opcional. En blanco, se usa el modelo que aparece en el campo."
            },
            apiToken: {
              title: "Token de la API",
              description:
                "Clave que otros sistemas usan para crear, consultar, modificar y borrar contactos por la API. Quien tiene el token tiene ese acceso: guárdalo en un lugar seguro y bórralo si se filtra."
            },
            klipyApiKey: {
              title: "Clave de KLIPY",
              description:
                "Clave gratuita de klipy.com (la biblioteca de GIFs y stickers de Discord). Con ella, la búsqueda de GIFs y stickers del chat usa KLIPY; sin ella, usa GIPHY. Vale para todas las empresas."
            },
            uploadLimit: {
              title: "Límite para enviar",
              description:
                "Los archivos más grandes no se envían como adjunto: el cliente recibe un enlace para descargarlos. En blanco, 15 MB."
            },
            downloadLimit: {
              title: "Límite para recibir",
              description:
                "Los archivos recibidos más grandes no se descargan, y el cliente recibe un aviso automático con el límite. En blanco, 15 MB."
            },
            defaultLanguage: {
              title: "Idioma predeterminado",
              description:
                "Idioma de los mensajes automáticos cuando el contacto, la conexión y la empresa no tienen un idioma definido."
            },
            allowSignup: {
              title: "Registro de nuevas empresas",
              description:
                "Deja abierta la página de registro para que nuevas empresas creen su cuenta solas."
            },
            gracePeriod: {
              title: "Tolerancia después del vencimiento",
              description:
                "Cuántos días una empresa con el pago vencido todavía puede usar el sistema antes de ser bloqueada."
            },
            useMultiThreadedWbot: {
              title: "Conexiones en hilos separados",
              description:
                "Ejecuta cada conexión de WhatsApp en su propio hilo. Ayuda a servidores con muchas conexiones. Vale a partir del próximo reinicio."
            },
            extension: {
              title: "Extensión de captura de WhatsApp Web",
              description:
                "Genera una extensión de Chrome con tu marca para conectar números por WhatsApp Web. Extrae el ZIP y carga la carpeta en Chrome como extensión descomprimida."
            },
            restart: {
              title: "Reiniciar el servidor",
              description:
                "Reinicia el backend. Las conexiones se caen por unos instantes y vuelven solas; esta pantalla se recarga enseguida."
            }
          }
        },
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
              name: "Blanco y negro",
              description:
                "La identidad predeterminada de vuup.me: limpia y neutra"
            },
            brandPurple: {
              name: "Morado",
              description: "Violeta vibrante y moderno"
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
        success: "Configuraciones guardadas exitosamente.",
        copiedToClipboard: "Copiado al portapapeles",
        title: "Configuraciones",
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
        transcribe: {
          action: "transcribir",
          loading: "transcribiendo…"
        },
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
        ai: {
          improve: "Mejorar respuesta",
          tone: "Cambiar tono",
          fix: "Corregir gramática y ortografía",
          suggest: "Sugerir una respuesta",
          summary: "Resumir la conversación",
          ask: "Preguntar al Copiloto",
          needsText: "Escribe en la barra para mejorar el texto",
          writing: "Escribiendo",
          use: "Usar",
          regenerate: "Generar otra versión",
          discard: "Descartar",
          keys: "Tab para usar · Esc para descartar",
          done: {
            improve: "Respuesta mejorada",
            tone: "Tono",
            fix: "Gramática corregida",
            suggest: "Respuesta sugerida",
            ask: "Respuesta del Copiloto"
          },
          tones: {
            professional: "Profesional",
            casual: "Casual",
            direct: "Directo",
            confident: "Seguro",
            friendly: "Amigable"
          }
        },
        linkPreview: {
          loading: "Cargando vista previa…",
          remove: "Enviar sin vista previa"
        },
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
        group: {
          header: "Info. del grupo",
          kind: "Grupo",
          members: "{{count}} miembro",
          members_plural: "{{count}} miembros",
          actionSearch: "Buscar",
          actionMembers: "Miembros",
          search: "Buscar miembros",
          you: "Tú",
          admin: "Admin. del grupo",
          showAll: "Ver todos ({{count}})",
          showMore: "Ver más",
          readMore: "Leer más",
          readLess: "Ver menos",
          noResults: "No se encontraron miembros",
          leave: "Salir del grupo",
          leaveConfirmTitle: "¿Salir de este grupo?",
          leaveConfirmText:
            "La conexión sale del grupo en WhatsApp y deja de recibir sus mensajes. Para volver necesitarás un enlace de invitación.",
          left: "Saliste del grupo",
          notMember: "Esta conexión ya no participa en este grupo.",
          join: "Unirse al grupo",
          joinTitle: "Unirse con enlace de invitación",
          joinLink: "Enlace de invitación",
          joinHint:
            "Pega el enlace de invitación de este grupo (chat.whatsapp.com/…).",
          joined: "¡Listo! La conexión volvió al grupo."
        },
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
      ticketContextMenu: {
        preview: "Ver conversación",
        markUnread: "Marcar como no leída",
        resolve: "Marcar como resuelta",
        pending: "Dejar pendiente",
        snooze: "Posponer",
        priority: "Prioridad",
        tags: "Asignar etiqueta",
        agent: "Asignar agente",
        queue: "Asignar cola",
        openNewTab: "Abrir en una pestaña nueva",
        copyLink: "Copiar enlace de la conversación",
        delete: "Eliminar conversación",
        loading: "Cargando…",
        me: "(tú)",
        empty: {
          tags: "Todavía no hay etiquetas.",
          agents: "No se encontraron agentes.",
          queues: "Todavía no hay colas."
        },
        priorities: {
          none: "Ninguna",
          low: "Baja",
          medium: "Media",
          high: "Alta",
          urgent: "Urgente"
        },
        priorityTooltip: "Prioridad: {{level}}",
        snoozeOptions: {
          reply: "Hasta que el cliente responda",
          hour: "Por 1 hora",
          tomorrow: "Hasta mañana",
          nextWeek: "Hasta la próxima semana",
          custom: "Elegir fecha y hora…",
          clear: "Quitar el aplazamiento"
        },
        snoozeDialog: {
          title: "Posponer la conversación hasta",
          confirm: "Posponer",
          cancel: "Cancelar"
        },
        toasts: {
          unread: "Marcada como no leída",
          resolved: "Conversación resuelta",
          pending: "Conversación devuelta a la cola",
          snoozed: "Pospuesta hasta {{when}}",
          snoozedReply: "Pospuesta hasta que el cliente responda",
          unsnoozed: "La conversación volvió a la lista",
          assigned: "Asignada a {{name}}",
          queued: "Enviada a la cola {{name}}",
          copied: "Enlace copiado",
          deleted: "Conversación eliminada"
        }
      },
      newConversation: {
        title: "Nueva conversación",
        subtitle: "Elige por dónde sale el mensaje y para quién.",
        inbox: "Bandeja de entrada",
        connected: "Conectado",
        disconnected: "Desconectado",
        noInbox: "Ningún WhatsApp conectado para iniciar conversación.",
        to: "Para",
        searchContact: "Nombre o número",
        changeContact: "Cambiar contacto",
        queue: "Cola",
        noQueue: "Sin cola",
        cancel: "Cancelar",
        start: "Iniciar conversación"
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
        ERR_DEV_TEST_NO_BROWSER: "El navegador de pruebas no está configurado",
        ERR_CODE_NOT_SENT:
          "No pudimos enviar el código a tu correo. Inténtalo de nuevo en un momento.",
        ERR_CODE_EXPIRED:
          "El código expiró. Inicia sesión de nuevo para recibir otro.",
        ERR_CODE_INVALID:
          "Código incorrecto. Revisa tu correo e inténtalo de nuevo.",
        ERR_WAIT_TO_RESEND: "Espera unos segundos para pedir otro código.",
        ERR_EMAIL_DISABLED:
          "El envío de correos no está configurado. Habla con el administrador.",
        ERR_RESET_LINK_EXPIRED:
          "Este enlace expiró o ya fue usado. Solicita uno nuevo.",
        ERR_PASSWORD_TOO_SHORT:
          "La contraseña debe tener al menos 6 caracteres.",
        ERR_NOT_A_GROUP: "Esta conversación no es de un grupo.",
        ERR_GROUP_LEAVE:
          "No se pudo salir del grupo ahora. Inténtalo de nuevo.",
        ERR_INVALID_INVITE: "Enlace de invitación inválido o vencido.",
        ERR_INVITE_OTHER_GROUP: "Ese enlace es de otro grupo.",
        ERR_INVALID_ADDRESS:
          "Dirección inválida. Revisa el código postal y el número.",
        ERR_TRANSCRIPTION_DISABLED:
          "La transcripción de audio está desactivada o no hay clave de IA configurada.",
        ERR_TRANSCRIPTION_FAILED: "No se pudo transcribir el audio.",
        ERR_NOT_AUDIO: "Este mensaje no es un audio.",
        ERR_INTERNAL:
          "Error interno del servidor. Por favor, contacte con soporte.",
        ERR_INVALID_PRIORITY: "Prioridad no válida.",
        ERR_INVALID_SNOOZE:
          "Elige una fecha y hora futura para posponer la conversación.",
        ERR_AI_NOT_CONFIGURED:
          "La IA no está configurada. Agrega la clave en Configuración > Opciones > Inteligencia artificial.",
        ERR_AI_EMPTY_TEXT: "Escribe algo en la barra primero.",
        ERR_AI_NO_MESSAGES:
          "Todavía no hay mensajes en esta conversación para que la IA lea.",
        ERR_AI_UNAVAILABLE:
          "La IA no respondió ahora. Inténtalo de nuevo en un momento.",
        ERR_AI_INVALID_TONE: "Tono no válido.",
        ERR_AI_INVALID_ACTION: "Acción de IA no válida.",
        ERR_INBOX_UNAVAILABLE:
          "Esta bandeja de entrada no puede iniciar una conversación ahora (desconectada o no es WhatsApp).",
        ERR_DEV_BUSY:
          "La solicitud se está ejecutando: espera a que los agentes terminen",
        ERR_DEV_INVALID_STAGE:
          "Esta acción no vale en la etapa actual de la solicitud",
        ERR_DEV_TITLE_REQUIRED: "Ponle un título a la solicitud",
        ERR_DEV_COMMENT_REQUIRED: "Escribe el comentario",
        ERR_DEV_SKILL_REQUIRED: "Escribe el nombre y el contenido de la skill",
        ERR_DEV_AI_NOT_CONFIGURED:
          "Falta la clave de la IA del pipeline en Configuración",
        ERR_DEV_AI_AUTH: "La clave de la IA fue rechazada",
        ERR_DEV_AI_MODEL:
          "El modelo elegido no existe o no está habilitado para esta clave",
        ERR_DEV_AI_RATE_LIMIT:
          "Límite de uso de la IA alcanzado: inténtalo en un rato",
        ERR_DEV_AI_OFFLINE: "Sin conexión con la IA",
        ERR_DEV_AI_REFUSAL: "La IA rechazó el pedido",
        ERR_DEV_AI_TRUNCATED:
          "La respuesta de la IA fue demasiado larga y se cortó",
        ERR_DEV_AI_FORMAT: "La IA respondió fuera del formato acordado",
        ERR_DEV_AI_FAILED: "La IA devolvió un error",
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
        ERR_TOO_MANY_ATTEMPTS:
          "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
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
          empty:
            "Sin horario definido: la cola atiende a cualquier hora y nadie recibe aviso de fuera de horario.",
          useDefault: "Usar de lunes a viernes, de 9 a 18",
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
