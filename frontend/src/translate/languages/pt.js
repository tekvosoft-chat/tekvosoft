const messages = {
  pt: {
    translations: {
      paywall: {
        changeTitle: "Bora mudar de plano?",
        changeText:
          "Aumente ou diminua quando quiser. No upgrade você paga a diferença de plano agora; no downgrade nada é cobrado hoje — a próxima cobrança já vem com o valor novo.",
        currentBadge: "SEU PLANO ATUAL",
        upgradeBadge: "UPGRADE ↑",
        downgradeBadge: "DOWNGRADE ↓",
        currentBtn: "Plano atual",
        upgradeBtn: "Fazer upgrade",
        downgradeBtn: "Mudar para este plano",
        changedTitle: "Plano alterado!",
        changedText:
          "Agora você está no {{plan}}. A próxima cobrança, em {{date}}, já vem com o novo valor.",
        title: "Opa! Seu acesso expirou",
        voluntaryTitle: "Escolha seu plano",
        adminText:
          "O período acabou e a gente também precisa pagar as contas 😅 Escolha um plano e libere o sistema agora mesmo — são 30 dias a partir do pagamento.",
        voluntaryText:
          "Pague agora e ganhe 30 dias a partir da data do pagamento.",
        userText:
          "O acesso da sua empresa está suspenso. Peça ao administrador para renovar a assinatura.",
        perMonth: "/mês",
        users: "Até {{count}} usuários",
        connections: "{{count}} conexões",
        queues: "{{count}} filas",
        pay: "Pagar {{value}}",
        logout: "Sair",
        later: "Agora não",
        thanksTitle: "Pagamento confirmado!",
        thanksText:
          "Muito obrigado por confiar na gente. Seu acesso foi liberado por mais 30 dias.",
        continue: "Continuar"
      },
      network: {
        reconnected: "Conectado de novo",
        server: "Servidor sem resposta, tentando de novo…",
        reconnecting: "Reconectando…",
        sending: "Enviando arquivo…",
        loading: "Carregando…",
        slow: "Conexão lenta",
        backOnline: "Internet de volta 🎉",
        offlineTitle: "A internet saiu para tomar um café",
        offlineText:
          "Já assobiamos para o roteador, mas ele não respondeu. Assim que ela voltar, a gente continua exatamente de onde você parou.",
        retry: "Tentar de novo"
      },
      payment: {
        cardPreview: {
          holder: "Titular",
          holderPlaceholder: "Nome no cartão",
          expiry: "Validade",
          ccv: "Cód. segurança"
        },
        title: "Pagamento da assinatura",
        pix: "Pix",
        card: "Cartão",
        boleto: "Boleto",
        payNow: "Pagar agora",
        processing: "Processando…",
        paid: "Pagamento aprovado!",
        copied: "Copiado",
        copyCode: "Copiar código Pix",
        copyLine: "Copiar linha digitável",
        openBoleto: "Abrir boleto",
        pixIntro:
          "Ao continuar, geramos um QR Code do Pix. O pagamento cai na hora.",
        pixHint:
          "Abra o app do banco, escolha Pix > Ler QR Code e aponte para a imagem.",
        boletoIntro:
          "Geramos o boleto em PDF com a linha digitável. A compensação leva até 3 dias úteis.",
        boletoHint: "O boleto também foi enviado para o e-mail da empresa.",
        cardIntro:
          "Cobrança na hora. Você pode guardar o cartão para as próximas mensalidades saírem sozinhas.",
        cardApproved: "Cartão aprovado! Sua assinatura já está em dia.",
        cardPending:
          "Cobrança enviada. Assim que o banco confirmar, sua assinatura é renovada.",
        cardSaved: "Cartão salvo: {{card}}",
        saveCard: "Salvar cartão para cobrança automática",
        saveCardHint:
          "Guardamos só um código seguro do cartão (token), nunca o número.",
        autoCharge: "Cobrança automática ativa · {{card}}",
        removeCard: "Remover cartão salvo",
        cardRemoved: "Cartão removido",
        noMethods: "Nenhuma forma de pagamento está ativa. Fale com o suporte.",
        form: {
          holder: "Nome impresso no cartão",
          number: "Número do cartão",
          expiry: "Validade (MM/AAAA)",
          ccv: "CVV",
          cpfCnpj: "CPF ou CNPJ",
          email: "E-mail",
          phone: "Celular",
          postalCode: "CEP",
          addressNumber: "Número"
        }
      },
      paymentGateways: {
        intro:
          "Escolha o que o cliente pode usar para pagar a assinatura. O que estiver desligado não aparece para ele.",
        pix: {
          title: "Pix",
          provider: "Efí (Gerencianet)",
          how: "O cliente lê um QR Code e o dinheiro cai na hora na sua conta Efí.",
          steps: [
            "Crie uma aplicação Pix na conta Efí e gere o certificado (.p12).",
            "Preencha abaixo o Client ID, o Client Secret, a chave Pix e envie o certificado.",
            "O sistema registra sozinho o aviso de pagamento (webhook) na Efí.",
            "Ao pagar, a fatura é baixada e o vencimento da empresa avança automaticamente."
          ]
        },
        card: {
          title: "Cartão de crédito",
          provider: "Asaas",
          how: "Cobrança na hora no cartão. Com o cartão salvo, as mensalidades seguintes são cobradas sozinhas.",
          steps: [
            "Crie a conta no Asaas e gere a chave de API (Integrações > API).",
            "Cole a chave abaixo e escolha Sandbox (testes) ou Produção.",
            "Cadastre a URL de aviso abaixo no painel do Asaas (Integrações > Webhooks) e repita o mesmo token.",
            "Peça ao Asaas a liberação da tokenização de cartão para usar a cobrança automática em produção.",
            "Todo dia, às 9h, o sistema cobra no cartão salvo as faturas que vencem."
          ]
        },
        boleto: {
          title: "Boleto bancário",
          provider: "Asaas",
          how: "Gera o boleto em PDF com linha digitável; a compensação leva até 3 dias úteis.",
          steps: [
            "Usa a mesma conta e a mesma chave do Asaas do cartão.",
            "O cliente recebe o boleto na tela e por e-mail.",
            "Quando o banco confirma, o Asaas avisa pelo webhook e a fatura é baixada sozinha."
          ]
        },
        asaas: {
          key: "Chave de API do Asaas",
          env: "Ambiente",
          sandbox: "Sandbox (testes)",
          production: "Produção",
          webhookToken: "Token do webhook",
          webhookUrl:
            "Cadastre esta URL no painel do Asaas (Integrações > Webhooks):"
        }
      },
      revenue: {
        monthly: "Receita mensal",
        monthlySub: "{{count}} cliente ativo",
        monthlySub_plural: "{{count}} clientes ativos",
        next30: "A receber em 30 dias",
        next30Sub: "Vencimentos do próximo mês",
        overdue: "Em atraso",
        overdueSub: "{{count}} cliente",
        overdueSub_plural: "{{count}} clientes",
        autoCharge: "Cobrança automática",
        autoChargeSub: "Clientes com cartão salvo",
        forecast: "Previsão dos próximos 6 meses",
        expected: "Previsto",
        clients: "Clientes",
        search: "Buscar cliente",
        empty: "Nenhum cliente com cobrança cadastrada.",
        value: "Valor",
        nextDue: "Próximo vencimento",
        status: "Situação",
        charge: "Cobrança",
        noPlan: "Sem plano",
        noDate: "Sem vencimento",
        today: "Vence hoje",
        inDays: "Em {{count}} dia",
        inDays_plural: "Em {{count}} dias",
        lateBy: "Atrasado {{count}} dia",
        lateBy_plural: "Atrasado {{count}} dias",
        auto: "Automática",
        manualCharge: "Manual",
        recurrence: {
          MENSAL: "Mensal",
          BIMESTRAL: "Bimestral",
          TRIMESTRAL: "Trimestral",
          SEMESTRAL: "Semestral",
          ANUAL: "Anual"
        }
      },
      planFeatures: {
        lockedTitle: "{{feature}} não está no seu plano",
        lockedText:
          "Esse recurso faz parte de outro plano. Fale com o administrador da plataforma para liberar.",
        lockedAction: "Ver meu plano",
        names: {
          useKanban: "Kanban",
          useInternalChat: "Chat interno",
          useSchedules: "Agendamentos",
          useCampaigns: "Campanhas",
          useExternalApi: "API de mensagens"
        },
        hints: {
          useKanban: "Quadro com as conversas em colunas por etapa.",
          useInternalChat: "Conversas entre a equipe, dentro do sistema.",
          useSchedules: "Programar mensagens para sair em data e hora.",
          useCampaigns: "Envio em massa para listas de contatos.",
          useExternalApi: "Enviar mensagens por outros sistemas, via token."
        }
      },
      plansPage: {
        title: "Planos",
        subtitle: "Limites e recursos de cada plano que você vende.",
        new: "Novo plano",
        edit: "Editar plano",
        editShort: "Editar",
        delete: "Excluir plano",
        templatesTitle: "Modelos prontos",
        templates: {
          start: "Para quem está começando, com 1 número.",
          pro: "O mais vendido: equipe pequena e agendamentos.",
          business: "Equipe grande, campanhas e API liberadas.",
          enterprise: "Operação em escala, sem amarras."
        },
        featuresTitle: "Recursos incluídos",
        popular: "Mais vendido",
        public: "Público",
        private: "Interno",
        perMonth: "/mês",
        form: {
          name: "Nome do plano",
          value: "Valor mensal",
          users: "Usuários",
          connections: "Conexões",
          queues: "Filas",
          currency: "Moeda",
          public: "Aparece no cadastro",
          publicHint: "Planos internos só você usa ao criar a empresa."
        },
        saved: "Plano salvo",
        saveError:
          "Não foi possível salvar. Confira se já existe um plano com esse nome.",
        loadError: "Não foi possível carregar os planos",
        deleteTitle: "Excluir {{name}}?",
        deleteText: "As empresas que usam este plano ficam sem plano.",
        deleted: "Plano excluído",
        deleteError: "Não foi possível excluir o plano"
      },
      queuesPage: {
        subtitle:
          "Organize o atendimento por setor e monte o menu automático de cada fila.",
        emptyTitle: "Nenhuma fila ainda",
        emptyText:
          "Crie filas como Vendas, Suporte ou Financeiro para distribuir os atendimentos.",
        chatbot: "Chatbot · {{count}} opção",
        chatbot_plural: "Chatbot · {{count}} opções",
        noChatbot: "Sem chatbot",
        hours: "Horário definido",
        noGreeting: "Sem mensagem de saudação",
        users: "Atendentes",
        connections: "Conexões",
        tickets: "Abertos + fila",
        edit: "Editar",
        delete: "Excluir",
        new: "Nova fila"
      },
      loginShowcase: {
        title: "Todo o atendimento da sua empresa em um lugar só"
      },
      annotator: {
        title: "Documento",
        annotate: "Desenhar",
        typeHere: "Digite aqui",
        tools: {
          pan: "Mover",
          pen: "Desenhar",
          highlight: "Destacar",
          underline: "Sublinhar",
          strike: "Riscar",
          text: "Texto",
          eraser: "Borracha"
        },
        sizes: {
          thin: "Fino",
          medium: "Médio",
          thick: "Grosso"
        },
        undo: "Desfazer (Ctrl+Z)",
        redo: "Refazer (Ctrl+Shift+Z)",
        clear: "Limpar anotações desta página",
        download: "Baixar",
        downloadAnnotated: "Baixar com as anotações",
        send: "Enviar na conversa",
        sent: "Arquivo anotado enviado",
        done: "Concluir",
        error: "Não foi possível abrir o arquivo.",
        loadingPreview: "Carregando prévia…",
        previewUnavailable: "Prévia indisponível",
        openAndAnnotate: "Abrir e anotar"
      },
      superDashboard: {
        title: "Painel da plataforma",
        live: "Ao vivo",
        tabs: {
          platform: "Visão geral",
          revenue: "Recebimentos",
          companies: "Empresas",
          mine: "Minha empresa"
        },
        server: "Servidor",
        cpu: "Processador",
        cpuSub: "{{cores}} núcleos · carga {{load}}",
        ram: "Memória RAM",
        app: "app",
        disk: "Espaço em disco",
        free: "{{size}} livres",
        database: "Banco de dados",
        processSub: "Backend {{rss}} · no ar há {{uptime}} · {{online}} online",
        platform: "Uso da plataforma",
        companies: "Empresas ativas",
        ofTotal: "de {{total}} cadastradas",
        users: "Usuários",
        onlineNow: "{{count}} online agora",
        connections: "Conexões",
        connected: "conectadas",
        tickets: "Atendimentos abertos",
        pending: "{{count}} aguardando",
        messagesToday: "Mensagens hoje",
        last30: "{{count}} em 30 dias",
        storage: "Armazenamento",
        contacts: "{{count}} contatos",
        activity: "Mensagens nos últimos 14 dias",
        sent: "Enviadas",
        received: "Recebidas",
        ranking: "Uso por empresa",
        metrics: {
          messages30d: "Mensagens",
          tickets30d: "Atendimentos",
          storage: "Disco",
          users: "Usuários"
        },
        clients: "Clientes",
        search: "Buscar empresa",
        active: "Ativa",
        blocked: "Bloqueada",
        dueIn: "vence em {{count}} dia",
        dueIn_plural: "vence em {{count}} dias",
        overdue: "vencida há {{count}} dia",
        overdue_plural: "vencida há {{count}} dias",
        max: "máx. {{count}}",
        onlineShort: "online",
        openShort: "abertos",
        messagesShort: "msgs 30d",
        usersOf: "{{count}} usuário criado",
        usersOf_plural: "{{count}} usuários criados",
        online: "Online",
        offline: "Offline",
        inactive: "inativo",
        userStats: "{{open}} abertos · {{sent}} msgs enviadas em 30 dias",
        newAdmin: "Novo administrador",
        newAdminHint:
          "O administrador cria e gerencia os usuários da empresa dele.",
        adminCreated: "Administrador criado",
        create: "Criar",
        form: {
          name: "Nome",
          email: "E-mail",
          password: "Senha"
        }
      },
      contactSchedules: {
        title: "Agendamentos",
        new: "Agendar",
        empty: "Nenhuma mensagem agendada para este contato.",
        pending: "{{count}} a enviar",
        pending_plural: "{{count}} a enviar",
        in: "sai em {{time}}",
        soon: "saindo agora",
        sentAgo: "enviada {{time}}",
        failedAgo: "falhou {{time}}",
        all: "Ver todos ({{count}})",
        less: "Mostrar menos",
        status: {
          pending: "Agendada",
          sent: "Enviada",
          error: "Erro"
        }
      },
      financePage: {
        changePlan: "Alterar plano",
        pageTitle: "Minha Assinatura",
        pageSubtitle:
          "Gerencie seu plano, pagamento e histórico em um só lugar.",
        currentPlan: "Assinatura atual",
        planBenefits: "Benefícios do plano",
        noPlan: "Sem plano",
        valuePaid: "Valor pago",
        planValue: "Valor do plano",
        expiresOn: "Expira em",
        expiredOn: "Venceu em",
        upgradeTitle: "Evolua seu plano para",
        upgradeText:
          "Com o upgrade, você passa para {{users}} usuários e {{connections}} conexões e desbloqueia novos recursos para a sua operação.",
        upgradeBtn: "Fazer upgrade",
        historyTitle: "Histórico de pagamento",
        seeAll: "Ver tudo",
        seeLess: "Ver menos",
        statusPaid: "Aprovado",
        renewalTitle: "Renovação",
        cardActive: "Ativo",
        cardPaused: "Pausado",
        cardExpires: "Expira {{date}}",
        cardSaved: "Cartão salvo",
        cardMenu: "Opções do cartão",
        cardRemove: "Remover cartão",
        cardRemoveConfirm:
          "Remover o cartão salvo? A renovação automática deixa de funcionar até você salvar outro cartão.",
        autoRenewOn: "Renovação automática ligada",
        autoRenewOff: "Renovação automática desligada",
        cardNote: "Este cartão é usado para renovar sua assinatura atual.",
        noCard: "Nenhum cartão salvo",
        noCardNote:
          'Ao pagar com cartão, marque "Salvar cartão" para renovar automaticamente.',
        addCard: "Adicionar cartão",
        addressTitle: "Endereço",
        addressUpdate: "Atualizar endereço",
        addressEmpty: "Nenhum endereço cadastrado.",
        addressNumber: "nº {{number}}",
        alertOpen: "Fatura de {{value}} em aberto",
        plansDialogTitle: "Planos e benefícios",
        close: "Fechar",
        address: {
          title: "Endereço de cobrança",
          postalCode: "CEP",
          street: "Rua",
          number: "Número",
          complement: "Complemento",
          district: "Bairro",
          city: "Cidade",
          state: "UF",
          save: "Salvar",
          cancel: "Cancelar",
          saved: "Endereço atualizado",
          cepNotFound: "CEP não encontrado"
        },
        plansTitle: "Planos",
        perMonth: "/mês",
        planUsers: "{{count}} usuário",
        planUsers_plural: "{{count}} usuários",
        planConnections: "{{count}} conexão",
        planConnections_plural: "{{count}} conexões",
        planQueues: "{{count}} fila",
        planQueues_plural: "{{count}} filas",
        planChat: "Chat interno",
        planSchedules: "Agendamentos",
        planApi: "API de integração",
        planCurrent: "SEU PLANO",
        planYours: "Plano atual",
        planChoose: "Escolher este plano",
        planChoosing: "Preparando…",
        methodsTitle: "Formas de pagamento",
        methodPix: "Pix",
        methodCard: "Cartão de crédito",
        methodBoleto: "Boleto",
        savedCardHint: "Cobrança automática todo mês neste cartão.",
        savedCardRemove: "Remover",
        title: "Financeiro",
        subtitle: "Acompanhe sua assinatura e suas cobranças.",
        days: "dia",
        days_plural: "dias",
        heroOk: "Tudo certo! Faltam {{count}} dia para a renovação",
        heroOk_plural: "Tudo certo! Faltam {{count}} dias para a renovação",
        heroToday: "Sua assinatura renova hoje",
        heroSub: "Seu acesso está garantido até {{date}}.",
        heroOverdue: "Sua assinatura venceu há {{count}} dia",
        heroOverdue_plural: "Sua assinatura venceu há {{count}} dias",
        heroOverdueSub:
          "Regularize a cobrança em aberto para continuar usando sem interrupções.",
        payNow: "Pagar agora",
        statOpen: "Em aberto",
        statPending: "A pagar",
        statPaid: "Pagas",
        history: "Cobranças",
        emptyTitle: "Nenhuma cobrança por aqui",
        emptyText: "Quando houver uma fatura, ela aparece nesta tela.",
        invoice: "Mensalidade",
        number: "Fatura #{{id}}",
        paid: "Paga",
        dueToday: "Vence hoje",
        dueTomorrow: "Vence amanhã",
        daysLeft: "Faltam {{count}} dia",
        daysLeft_plural: "Faltam {{count}} dias",
        overdueFor: "Venceu há {{count}} dia",
        overdueFor_plural: "Venceu há {{count}} dias",
        dueOn: "Vence em {{date}}",
        dueWas: "Venceu em {{date}}",
        pay: "Pagar",
        paidBtn: "Paga ✓"
      },
      forwardModal: {
        title: "Encaminhar mensagem para",
        search: "Pesquisar nome ou número",
        recent: "Conversas recentes",
        contacts: "Contatos",
        empty: "Nenhum contato encontrado",
        group: "Grupo",
        remove: "Remover",
        max: "Você pode encaminhar para até {{count}} conversas",
        caption: "Adicione uma mensagem",
        send: "Encaminhar",
        sent: "Mensagem encaminhada",
        sent_plural: "Mensagem encaminhada para {{count}} conversas",
        queue: "Fila: {{name}}",
        queueHint: "Fila usada quando o contato não tem atendimento aberto",
        media: {
          image: "Foto",
          video: "Vídeo",
          audio: "Áudio",
          document: "Arquivo",
          sticker: "Figurinha"
        }
      },
      instances: {
        summary: "{{connected}} de {{total}} conectadas",
        new: "Nova conexão",
        noProfile: "Perfil aparece quando conectar",
        updated: "Atualizado {{time}}",
        default: "Conexão padrão",
        channel: "Canal",
        queues: "Filas",
        lastUpdate: "Última atualização",
        yes: "Sim",
        no: "Não",
        status: {
          CONNECTED: "Conectado",
          qrcode: "Aguardando QR Code",
          passkey_required: "Passkey necessária",
          PAIRING: "Sem sinal do celular",
          TIMEOUT: "Sem sinal do celular",
          OPENING: "Conectando…",
          DISCONNECTED: "Desconectado"
        },
        actions: {
          scan: "Ler QR Code",
          retry: "Reconectar",
          passkey: "Usar passkey",
          newQr: "Novo QR Code",
          resetPasskey: "Reiniciar passkey",
          disconnect: "Desconectar",
          refresh: "Refazer conexão",
          edit: "Configurar",
          privacy: "Privacidade",
          delete: "Excluir"
        }
      },
      orientation: {
        title: "Gire o celular",
        text: "O vuup.me foi feito para usar com o celular em pé. Vire o aparelho para continuar."
      },
      ticketHeaderActions: {
        resolve: "Resolver",
        resolveHint: "Marcar como concluído e encerrar o atendimento",
        resolved: "Atendimento resolvido",
        transfer: "Transferir",
        transferHint: "Passar para outra fila ou atendente",
        return: "Devolver à fila",
        returnHint: "Volta para Aguardando, sem atendente",
        schedule: "Agendar mensagem",
        scheduleHint: "Programar um envio para este contato",
        delete: "Excluir atendimento",
        deleteHint: "Apaga o atendimento e as mensagens dele",
        reopen: "Reabrir",
        more: "Mais ações"
      },
      usersPage: {
        subtitle: "Quem pode entrar e atender pela sua empresa.",
        filters: {
          all: "Todos",
          active: "Ativos",
          inactive: "Inativos"
        },
        active: "Ativo",
        inactive: "Inativo",
        activateHint: "Liberar o acesso deste usuário",
        deactivateHint: "Bloquear o acesso: a pessoa sai do sistema na hora",
        selfHint: "Você não pode desativar a si mesmo",
        activated: "{{name}} está ativo",
        deactivated: "{{name}} foi desativado",
        edit: "Editar",
        delete: "Excluir",
        deactivatedByAdmin: "Seu acesso foi desativado pelo administrador."
      },
      chatWallpaper: {
        tabs: {
          gif: "Animados",
          image: "Fotos",
          color: "Cores",
          classic: "Clássicos"
        },
        title: "Fundo das conversas",
        subtitle:
          "Desenhado com as cores do tema escolhido. Seus balões de mensagem também seguem a paleta.",
        sampleIn: "Oi! Tudo bem? 😊",
        sampleOut: "Tudo ótimo, em que posso ajudar?",
        options: {
          landscape: "Paisagem",
          waves: "Ondas",
          gradient: "Degradê",
          doodle: "Rabiscos",
          plain: "Liso"
        }
      },
      date: {
        yesterday: "Ontem"
      },
      common: {
        yesterday: "Ontem",
        today: "Hoje",
        search: "Buscar",
        emptyTitle: "Nada por aqui ainda",
        emptyDescription:
          "Assim que houver registros, eles aparecem nesta lista.",
        emptySearchTitle: "Nenhum resultado",
        emptySearchDescription:
          "Nada corresponde ao que você buscou. Tente outro termo.",
        filter: "Filtrar",
        edit: "Editar",
        delete: "Excluir",
        cancel: "Cancelar",
        save: "Salvar",
        confirm: "Confirmar",
        confirmation: "Confirmação",
        areyousure: "Você tem certeza?",
        close: "Fechar",
        back: "Voltar",
        closed: "Fechado",
        error: "Erro",
        success: "Sucesso",
        actions: "Ações",
        add: "Adicionar",
        name: "Nome",
        email: "Email",
        phone: "Telefone",
        language: "Idioma",
        company: "Empresa",
        user: "Usuário",
        users: "Usuários",
        connection: "Conexão",
        connections: "Conexões",
        queue: "Fila",
        queues: "Filas",
        contact: "Contato",
        messages: "Mensagens",
        whatsappNumber: "Número do Whatsapp",
        dueDate: "Data de vencimento",
        copy: "Copiar",
        paste: "Colar",
        proceed: "Prosseguir",
        enabled: "Ativado",
        disabled: "Desativado",
        undefined: "Indefinido",
        yes: "Sim",
        no: "Não",
        noqueue: "Sem fila",
        rating: "Avaliação",
        transferTo: "Transferir para",
        key: "Chave",
        value: "Valor",
        validations: {
          required: "Este campo é obrigatório",
          short: "Valor muito curto",
          long: "Valor muito longo",
          invalid: "Valor inválido",
          invalidEmail: "Email inválido",
          invalidPhone: "Número de telefone inválido"
        },
        status: "Status",
        serverTime: "Hora do servidor:",
        clientTime: "Hora do cliente:",
        differenceMinutes: "Diferença: {{count}} minuto(s)"
      },
      signup: {
        options: {
          segment: {
            retail: "Varejo / Loja",
            services: "Serviços",
            health: "Saúde e bem-estar",
            education: "Educação",
            food: "Alimentação",
            realEstate: "Imobiliário",
            tech: "Tecnologia",
            other: "Outro"
          },
          teamSize: {
            1: "Só eu",
            "2-5": "2 a 5 pessoas",
            "6-20": "6 a 20 pessoas",
            "21-50": "21 a 50 pessoas",
            "50+": "Mais de 50"
          },
          goal: {
            sales: "Vender mais",
            support: "Atendimento / suporte",
            scheduling: "Agendamentos",
            marketing: "Campanhas e marketing",
            other: "Outro"
          },
          source: {
            google: "Google",
            instagram: "Instagram",
            youtube: "YouTube",
            referral: "Indicação",
            other: "Outro"
          }
        },
        aboutBusiness: "Sobre o seu negócio",
        subheading: "7 dias grátis. Sem cartão de crédito.",
        heading: "Crie sua conta",
        title: "Cadastre-se",
        toasts: {
          success: "Usuário criado com sucesso! Faça seu login!!!.",
          fail: "Erro ao criar usuário. Verifique os dados informados."
        },
        form: {
          source: "Como nos conheceu?",
          goal: "Principal objetivo",
          teamSize: "Tamanho da equipe",
          segment: "Segmento",
          name: "Nome",
          email: "Email",
          password: "Senha"
        },
        buttons: {
          submit: "Cadastrar",
          login: "Já tem uma conta? Entre!"
        }
      },
      forgotPassword: {
        heading: "Esqueceu a senha?",
        subheading:
          "Informe seu e-mail e enviaremos um link para criar uma senha nova.",
        email: "E-mail",
        submit: "Enviar link",
        sentHeading: "Confira seu e-mail",
        sent: "Se houver uma conta com {{email}}, você vai receber um link para criar uma senha nova. Ele vale por 30 minutos.",
        back: "Voltar para o login"
      },
      resetPassword: {
        heading: "Crie uma senha nova",
        subheading: "Use pelo menos 6 caracteres.",
        password: "Nova senha",
        confirm: "Repita a nova senha",
        submit: "Salvar senha",
        mismatch: "As senhas não são iguais.",
        success: "Senha alterada. Entre com a senha nova.",
        invalid: "Este link não é válido. Peça um novo.",
        requestNew: "Pedir um link novo"
      },
      login: {
        forgot: "Esqueci minha senha",
        code: {
          heading: "Confirme que é você",
          subheading:
            "Enviamos um código de 6 dígitos para {{email}}. Ele vale por 10 minutos.",
          label: "Código",
          submit: "Confirmar",
          resend: "Reenviar código",
          resendIn: "Reenviar em {{seconds}}s",
          resent: "Enviamos um código novo.",
          back: "Voltar",
          hint: "Depois disso, este navegador fica liberado."
        },
        subheading: "Entre para continuar seus atendimentos.",
        heading: "Bem-vindo de volta",
        title: "Login",
        form: {
          email: "Email",
          password: "Senha"
        },
        buttons: {
          submit: "Entrar",
          register: "Não tem uma conta? Cadastre-se!"
        }
      },
      companies: {
        title: "Cadastrar Empresa",
        form: {
          name: "Nome da Empresa",
          plan: "Plano",
          token: "Token",
          submit: "Cadastrar",
          success: "Empresa criada com sucesso!"
        }
      },
      companiesManager: {
        form: {
          campaigns: "Campanhas",
          recurrence: "Recorrência",
          monthly: "Mensal",
          bimonthly: "Bimestral",
          quarterly: "Trimestral",
          semiannual: "Semestral",
          annual: "Anual"
        },
        buttons: {
          clear: "Limpar",
          accessAs: "Acessar como",
          incrementDueDate: "+ Vencimento",
          user: "Usuário"
        },
        table: {
          storage: "Armazenamento",
          campaigns: "Campanhas",
          createdAt: "Criada Em"
        },
        toasts: {
          loadError: "Não foi possível carregar a lista de registros",
          operationSuccess: "Operação realizada com sucesso",
          operationError: "Não foi possível realizar a operação",
          operationErrorDuplicate:
            "Não foi possível realizar a operação. Verifique se já existe uma empresa com o mesmo nome ou se os campos foram preenchidos corretamente"
        },
        confirmationModal: {
          deleteTitle: "Exclusão de Registro",
          deleteMessage: "Deseja realmente excluir esse registro?",
          impersonateTitle: "Acessar como",
          impersonateMessage: "Deseja acessar o sistema como esta empresa?"
        }
      },
      auth: {
        toasts: {
          success: "Login efetuado com sucesso!"
        },
        token: "Token"
      },
      dashboard: {
        sections: {
          now: "Agora",
          nowHint: "Situação em tempo real",
          period: "No período",
          periodHint: "Números do intervalo escolhido",
          team: "Equipe",
          teamHint: "Desempenho de cada atendente no período"
        },
        team: {
          online: "Online agora",
          offline: "Offline",
          total: "Total",
          open: "Abertos",
          closed: "Resolvidos",
          wait: "Espera",
          service: "Atendimento"
        },
        usersOnline: "Usuários online",
        ticketsWaiting: "Atendimentos aguardando",
        ticketsOpen: "Atendimentos abertos",
        ticketsDone: "Atendimentos resolvidos",
        totalTickets: "Total de atendimentos",
        newContacts: "Novos contatos",
        avgServiceTime: "Tempo médio de atendimento",
        avgWaitTime: "Tempo médio de espera",
        ticketsOnPeriod: "Atendimentos no período",
        userCurrentStatus: "Status (Atual)",
        filter: {
          invalid: "Escolha um período válido para filtrar.",
          period: "Período",
          custom: "Personalizado",
          last3days: "Últimos 3 dias",
          last7days: "Últimos 7 dias",
          last14days: "Últimos 14 dias",
          last30days: "Últimos 30 dias",
          last90days: "Últimos 90 dias"
        },
        date: {
          start: "Data inicial",
          end: "Data final"
        },
        ticketCountersLabels: {
          created: "Criado",
          closed: "Fechado"
        }
      },
      connections: {
        title: "Conexões",
        toasts: {
          deleted: "Conexão com o WhatsApp excluída com sucesso!"
        },
        confirmationModal: {
          deleteTitle: "Deletar",
          deleteMessage: "Você tem certeza? Essa ação não pode ser revertida.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "Tem certeza? Você precisará ler o QR Code novamente para reconectar. Nada é apagado no WhatsApp.",
          purge:
            "Apagar tudo desta conexão do sistema: atendimentos, mensagens, mídias e os contatos que só conversaram por ela. Não dá para desfazer.",
          purgeOnDelete: "Excluir todas as conversas da conexão",
          purgeOnDeleteHint:
            "Atendimentos, mensagens, mídias e os contatos que só conversaram por ela. Não dá para desfazer.",
          closeTickets: "Fechar todos os atendimentos desta conexão"
        },
        buttons: {
          add: "Adicionar WhatsApp",
          disconnect: "desconectar",
          tryAgain: "Tentar novamente",
          qrcode: "QR CODE",
          newQr: "Novo QR CODE",
          connecting: "Conectando"
        },
        toolTips: {
          disconnected: {
            title: "Falha ao iniciar sessão do WhatsApp",
            content:
              "Certifique-se de que seu celular esteja conectado à internet e tente novamente, ou solicite um novo QR Code"
          },
          qrcode: {
            title: "Esperando leitura do QR Code",
            content:
              "Clique no botão 'QR CODE' e leia o QR Code com o seu celular para iniciar a sessão"
          },
          connected: {
            title: "Conexão estabelecida!"
          },
          timeout: {
            title: "A conexão com o celular foi perdida",
            content:
              "Certifique-se de que seu celular esteja conectado à internet e o WhatsApp esteja aberto, ou clique no botão 'Desconectar' para obter um novo QR Code"
          },
          passkey: {
            title: "Autenticação por passkey necessária",
            content:
              "Clique no botão de passkey e use a extensão do navegador para capturar a sessão autenticada do WhatsApp Web."
          },
          refresh: "Refazer conexão",
          disconnect: "Desconectar",
          scan: "Ler QR Code",
          newQr: "Gerar novo QR Code",
          retry: "Tentar novamente",
          resetPasskey: "Reiniciar sessão passkey"
        },
        table: {
          name: "Nome",
          status: "Status",
          lastUpdate: "Última atualização",
          default: "Padrão",
          actions: "Ações",
          session: "Sessão"
        }
      },
      trialBanner: {
        daysLeft: "Seu teste grátis termina em {{count}} dias",
        tomorrow: "Seu teste grátis termina amanhã",
        today: "Seu teste grátis termina hoje",
        ended: "Seu teste grátis terminou",
        cta: "Assinar agora"
      },
      mediaPreview: {
        add: "Adicionar arquivo",
        captionPlaceholder: "Adicionar legenda…",
        position: "{{current}} de {{total}}",
        files: "arquivos",
        remove: "Remover",
        send: "Enviar"
      },
      internalChat: {
        channelsCount_plural: "{{count}} canais",
        channelsCount: "{{count}} canal",
        newChannel: "Criar canal",
        allAreas: "Todas as conversas",
        areas: "Áreas",
        areaHelp:
          "Os canais ficam agrupados por área, nas bolinhas à esquerda.",
        areaPlaceholder: "Ex.: Vendas, Suporte, Financeiro",
        area: "Área",
        title: "Chat Interno",
        subtitle: "Conversas com a sua equipe",
        newChat: "Nova conversa",
        emptyListTitle: "Nenhuma conversa ainda",
        emptyListDescription:
          "Crie uma conversa e escolha quem da equipe participa.",
        selectTitle: "Selecione uma conversa",
        selectDescription:
          "Escolha uma conversa na lista ou comece uma nova com a sua equipe.",
        participants: "participantes",
        typeMessage: "Escreva uma mensagem",
        edit: "Editar",
        delete: "Excluir",
        deleteTitle: "Excluir conversa",
        deleteMessage: "Esta ação não pode ser desfeita. Confirmar?",
        you: "Você"
      },
      whatsappModal: {
        title: {
          add: "Adicionar WhatsApp",
          edit: "Editar WhatsApp"
        },
        form: {
          name: "Nome",
          default: "Padrão"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "WhatsApp salvo com sucesso."
      },
      qrCode: {
        message: "Leia o QrCode para iniciar a sessão",
        extensionHint: "Autenticar pelo WhatsApp Web",
        startCapture: "Capturar sessão do WhatsApp Web",
        installExtension: "Instalar Extensão de Captura"
      },
      passkeyModal: {
        title: "Extensão de Captura do WhatsApp Web",
        instructions:
          "Use a extensão do navegador para capturar a sessão autenticada do WhatsApp Web e enviá-la ao servidor.",
        connectorNotFound:
          "Extensão não detectada. Instale a extensão de captura passkey e recarregue a página.",
        connectorReady:
          "Extensão detectada. Clique abaixo para autenticar pelo WhatsApp Web.",
        startCapture: "Iniciar Captura",
        waitingForCapture: "Aguardando a captura da sessão do WhatsApp Web…",
        existingSession: "O WhatsApp Web já possui uma sessão para {{number}}.",
        captureExisting: "Capturar esta sessão",
        clearAndContinue: "Limpar sessão local e continuar",
        importSent: "Sessão capturada e enviada com sucesso.",
        importError: "Falha na captura: {{reason}}.",
        missingToken: "Token de captura ausente. Recarregue a página.",
        downloadExtension: "Baixar extensão de captura",
        installInstructions: "Como instalar",
        hideInstructions: "Ocultar instruções",
        instructionsIntro: "Siga os passos abaixo para instalar a extensão:",
        installStep1: "Baixe o arquivo ZIP da extensão.",
        installStep2: "Extraia o arquivo ZIP para uma pasta no seu computador.",
        installStep3: "Abra o Google Chrome e acesse chrome://extensions/.",
        installStep4:
          "Ative o Modo de desenvolvedor usando a chave no canto superior direito.",
        installStep5: 'Clique em "Carregar sem compactação".',
        installStep6: "Selecione a pasta da extensão extraída.",
        installStep7: "A extensão está instalada e pronta para uso.",
        installStep8:
          "Recarregue esta página com F5 e tente conectar novamente."
      },
      contacts: {
        title: "Contatos",
        toasts: {
          imported:
            "Importação iniciada. Os contatos aparecem na lista em instantes.",
          deleted: "Contato excluído com sucesso!"
        },
        searchPlaceholder: "Pesquisar...",
        confirmationModal: {
          deleteTitle: "Deletar ",
          importTitlte: "Importar contatos",
          deleteMessage:
            "Tem certeza que deseja deletar este contato? Todos os atendimentos relacionados serão perdidos.",
          importMessage: "Deseja importar todos os contatos do telefone?"
        },
        buttons: {
          importCsv: "Importar de arquivo CSV",
          exportCsv: "Exportar para CSV",
          import: "Importar Contatos",
          add: "Adicionar Contato"
        },
        table: {
          name: "Nome",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Ações"
        }
      },
      contactModal: {
        title: {
          add: "Adicionar contato",
          edit: "Editar contato"
        },
        form: {
          mainInfo: "Dados do contato",
          extraInfo: "Informações adicionais",
          name: "Nome",
          number: "Número do Whatsapp",
          email: "Email",
          extraName: "Nome do campo",
          extraValue: "Valor",
          disableBot: "Desabilitar chatbot"
        },
        buttons: {
          addExtraInfo: "Adicionar informação",
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Contato salvo com sucesso."
      },
      queueModal: {
        confirmationModal: {
          deleteTitle: "Excluir arquivo?",
          deleteMessage:
            "O arquivo anexado será removido. Essa ação não pode ser desfeita."
        },
        title: {
          add: "Adicionar fila",
          edit: "Editar fila"
        },
        form: {
          name: "Nome",
          color: "Cor",
          greetingMessage: "Mensagem de saudação",
          complationMessage: "Mensagem de conclusão",
          outOfHoursMessage: "Mensagem de fora de expediente",
          ratingMessage: "Mensagem de avaliação",
          transferMessage: "Mensagem de Transferência",
          token: "Token"
        },
        toasts: {
          deleted: "Arquivo removido",
          saved: "Fila salva com sucesso"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
          attach: "Anexar Arquivo"
        },
        serviceHours: {
          dayWeek: "Dia da semana",
          startTimeA: "Hora Inicial - Turno A",
          endTimeA: "Hora Final - Turno A",
          startTimeB: "Hora Inicial - Turno B",
          endTimeB: "Hora Final - Turno B",
          monday: "Segunda-feira",
          tuesday: "Terça-feira",
          wednesday: "Quarta-feira",
          thursday: "Quinta-feira",
          friday: "Sexta-feira",
          saturday: "Sábado",
          sunday: "Domingo"
        }
      },
      userModal: {
        photo: {
          add: "Adicionar foto",
          change: "Trocar foto",
          remove: "Remover",
          hint: "JPG ou PNG. Aparece no topo, no menu e no chat interno.",
          saved: "Foto atualizada",
          removed: "Foto removida"
        },
        title: {
          add: "Adicionar usuário",
          edit: "Editar usuário"
        },
        listItems: {
          adminProfile: "Administrador",
          userProfile: "Usuário"
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Senha",
          profile: "Perfil"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Usuário salvo com sucesso."
      },
      scheduleModal: {
        mediaOrText: "Escreva uma mensagem ou anexe uma imagem.",
        removeMedia: "Remover anexo",
        addMedia: "Adicionar imagem",
        title: {
          add: "Novo Agendamento",
          edit: "Editar Agendamento"
        },
        form: {
          body: "Mensagem",
          contact: "Contato",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          saveMessage: "Salvar Mensagem no Ticket"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Agendamento salvo com sucesso."
      },
      tagModal: {
        title: {
          add: "Nova Tag",
          edit: "Editar Tag",
          addKanban: "Nova coluna",
          editKanban: "Editar coluna"
        },
        form: {
          name: "Nome",
          color: "Cor",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Tag salvo com sucesso.",
        successKanban: "Coluna salva com sucesso."
      },
      chat: {
        noTicketMessage: "Selecione um ticket para começar a conversar."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTE E SOLTE ARQUIVOS NO CAMPO ABAIXO",
          titleFileList: "Lista de arquivo(s)"
        }
      },
      todolist: {
        title: "Lista de tarefas",
        form: {
          name: "Nome da tarefa"
        },
        buttons: {
          add: "Adicionar",
          save: "Salvar"
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Novo"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Filas"
      },
      tickets: {
        draft: "Rascunho",
        toasts: {
          deleted: "O atendimento que você estava foi deletado."
        },
        notification: {
          message: "Mensagem de",
          nomessages: "Sem novas mensagens"
        },
        tabs: {
          open: { title: "Abertas" },
          closed: { title: "Resolvidos" },
          groups: { title: "Grupos" },
          search: { title: "Busca" }
        },
        search: {
          filterByUsers: "Filtrar por usuários",
          filterByTags: "Filtrar por tags",
          placeholder: "Buscar atendimento e mensagens"
        },
        buttons: {
          showAll: "Todos"
        }
      },
      transferTicketModal: {
        hintQueue:
          'Sem atendente, o atendimento volta para "Aguardando" da fila escolhida.',
        hintUser: "Vai direto para {{name}}, já em atendimento.",
        userLabel: "Atendente (opcional)",
        title: "Transferir atendimento",
        fieldLabel: "Digite para buscar usuários",
        fieldQueueLabel: "Fila de destino",
        fieldQueuePlaceholder: "Selecione uma fila",
        noOptions: "Nenhum usuário encontrado com esse nome",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar"
        }
      },
      ticketsList: {
        media: {
          photo: "Foto",
          audio: "Áudio",
          video: "Vídeo",
          document: "Documento",
          gif: "GIF",
          sticker: "Figurinha"
        },
        pendingHeader: "Aguardando",
        assignedHeader: "Atendendo",
        noTicketsTitle: "Nada aqui!",
        noTicketsMessage:
          "Nenhum atendimento encontrado com esse status ou termo pesquisado",
        buttons: {
          accept: "Aceitar"
        }
      },
      newTicketModal: {
        title: "Criar Ticket",
        fieldLabel: "Digite para pesquisar o contato",
        add: "Adicionar",
        buttons: {
          ok: "Salvar",
          cancel: "Cancelar"
        }
      },
      mainDrawer: {
        sections: {
          service: "Atendimento",
          audience: "Contatos",
          management: "Gestão",
          system: "Sistema"
        },
        listItems: {
          dashboard: "Dashboard",
          connections: "Conexões",
          tickets: "Atendimentos",
          quickMessages: "Respostas Rápidas",
          contacts: "Contatos",
          queues: "Filas & Chatbot",
          tags: "Tags",
          administration: "Administração",
          service: "Atendimento",
          users: "Usuários",
          settings: "Configurações",
          helps: "Ajuda",
          messagesAPI: "API",
          schedules: "Agendamentos",
          campaigns: "Campanhas",
          annoucements: "Informativos",
          chats: "Chat Interno",
          chatsShort: "Chat",
          ticketsShort: "Conversas",
          search: "Buscar",
          online: "Online",
          noResults: "Nada encontrado",
          financeiro: "Financeiro",
          logout: "Sair",
          management: "Gerência",
          kanban: "Kanban",
          tasks: "Tarefas",
          more: "Mais",
          menu: "Menu"
        },
        appBar: {
          i18n: {
            language: "Português 🇧🇷",
            language_short: "pt_BR"
          },
          user: {
            profile: "Perfil",
            subscriptionValidUntilLabel: "Assinatura válida até",
            darkmode: "Modo escuro",
            lightmode: "Modo claro",
            language: "Selecionar idioma",
            about: "Sobre",
            logout: "Sair"
          }
        }
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Número",
          body: "Mensagem",
          token: "Token cadastrado"
        },
        mediaMessage: {
          number: "Número",
          body: "Nome do arquivo",
          media: "Arquivo",
          token: "Token cadastrado"
        }
      },
      notifications: {
        noTickets: "Nenhuma notificação.",
        volume: "Volume das notificações"
      },
      quickMessages: {
        title: "Respostas Rápidas",
        buttons: {
          add: "Nova Resposta"
        },
        dialog: {
          shortcode: "Atalho",
          message: "Resposta"
        }
      },
      kanban: {
        title: "Kanban",
        subtitle:
          "Arraste os contatos entre as colunas para acompanhar cada etapa do atendimento.",
        inbox: "Em aberto",
        newLane: "Nova coluna",
        editLane: "Editar coluna",
        deleteLane: "Excluir coluna",
        deleteLaneTitle: "Excluir a coluna",
        deleteLaneMessage:
          "Os atendimentos desta coluna voltam para Em aberto. Nenhum atendimento é apagado.",
        moveTo: "Mover para",
        moveLeft: "Mover para a esquerda",
        moveRight: "Mover para a direita",
        openConversation: "Abrir conversa",
        emptyLane: "Arraste atendimentos para cá",
        noLanesTitle: "Monte o seu quadro",
        noLanesDescription:
          "Crie colunas com nome e cor para organizar os atendimentos por etapa: novo, em negociação, pago…",
        unassigned: "Sem atendente",
        moved: "Atendimento movido",
        ticketsCount: "atendimentos",
        searchPlaceholder: "Pesquisa",
        subMenus: {
          list: "Painel",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Em aberto",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir esta Lane?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Tickets",
          actions: "Ações"
        },
        buttons: {
          add: "Nova Lane"
        },
        toasts: {
          deleted: "Lane excluída com sucesso."
        }
      },
      contactLists: {
        title: "Listas de Contatos",
        table: {
          name: "Nome",
          contacts: "Contatos",
          actions: "Ações"
        },
        buttons: {
          add: "Nova Lista"
        },
        dialog: {
          name: "Nome",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        toasts: {
          deleted: "Registro excluído",
          created: "Registro criado"
        }
      },
      contactListItems: {
        title: "Contatos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo",
          lists: "Listas",
          import: "Importar"
        },
        dialog: {
          name: "Nome",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        table: {
          name: "Nome",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          actions: "Ações"
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
          importMessage: "Deseja importar os contatos desta planilha? ",
          importTitlte: "Importar"
        },
        toasts: {
          deleted: "Registro excluído"
        }
      },
      campaigns: {
        title: "Campanhas",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Nova Campanha",
          contactLists: "Listas de Contatos"
        },
        table: {
          name: "Nome",
          whatsapp: "Conexão",
          contactList: "Lista de Contatos",
          status: "Status",
          scheduledAt: "Agendamento",
          completedAt: "Concluída",
          confirmation: "Confirmação",
          actions: "Ações"
        },
        dialog: {
          new: "Nova Campanha",
          update: "Editar Campanha",
          readonly: "Apenas Visualização",
          form: {
            name: "Nome",
            message1: "Mensagem 1",
            message2: "Mensagem 2",
            message3: "Mensagem 3",
            message4: "Mensagem 4",
            message5: "Mensagem 5",
            confirmationMessage1: "Mensagem de Confirmação 1",
            confirmationMessage2: "Mensagem de Confirmação 2",
            confirmationMessage3: "Mensagem de Confirmação 3",
            confirmationMessage4: "Mensagem de Confirmação 4",
            confirmationMessage5: "Mensagem de Confirmação 5",
            messagePlaceholder: "Conteúdo da mensagem",
            whatsapp: "Conexão",
            status: "Status",
            scheduledAt: "Agendamento",
            confirmation: "Confirmação",
            contactList: "Lista de Contato"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Fechar",
            attach: "Anexar Arquivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        toasts: {
          success: "Operação realizada com sucesso",
          cancel: "Campanha cancelada",
          restart: "Campanha reiniciada",
          deleted: "Registro excluído"
        }
      },
      announcements: {
        title: "Informativos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo Informativo",
          contactLists: "Listas de Informativos"
        },
        table: {
          priority: "Prioridade",
          title: "Title",
          text: "Texto",
          mediaName: "Arquivo",
          status: "Status",
          actions: "Ações"
        },
        dialog: {
          edit: "Edição de Informativo",
          add: "Novo Informativo",
          update: "Editar Informativo",
          readonly: "Apenas Visualização",
          form: {
            priority: "Prioridade",
            title: "Title",
            text: "Texto",
            mediaPath: "Arquivo",
            status: "Status"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Fechar",
            attach: "Anexar Arquivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        toasts: {
          success: "Operação realizada com sucesso",
          deleted: "Registro excluído"
        }
      },
      campaignsConfig: {
        title: "Configurações de Campanhas",
        intervals: "Intervalos",
        messageInterval: "Intervalo entre mensagens (segundos)",
        longerIntervalAfter: "Intervalo maior após (mensagens)",
        longerInterval: "Intervalo maior (segundos)",
        addVariable: "Adicionar variável"
      },
      queues: {
        title: "Filas & Chatbot",
        table: {
          name: "Nome",
          color: "Cor",
          greeting: "Mensagem de saudação",
          actions: "Ações"
        },
        toasts: {
          deleted: "Fila removida com sucesso"
        },
        buttons: {
          add: "Adicionar fila"
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage:
            "Você tem certeza? Essa ação não pode ser revertida! Os atendimentos dessa fila continuarão existindo, mas não terão mais nenhuma fila atribuída."
        }
      },
      queueSelect: {
        inputLabel: "Filas"
      },
      users: {
        title: "Usuários",
        table: {
          name: "Nome",
          email: "Email",
          profile: "Perfil",
          actions: "Ações"
        },
        buttons: {
          add: "Adicionar usuário"
        },
        toasts: {
          deleted: "Usuário excluído com sucesso."
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage:
            "Todos os dados do usuário serão perdidos. Os atendimento abertos deste usuário serão movidos para a fila."
        }
      },
      helps: {
        title: "Central de Ajuda"
      },
      notificationSound: {
        title: "Som das notificações",
        description:
          "Toca um aviso sonoro quando chega mensagem nova. Vale só para este aparelho.",
        on: "ligado",
        off: "desligado"
      },
      push: {
        title: "Notificações neste aparelho",
        description:
          "Receba as mensagens novas com o nome e a foto do contato, mesmo com o app fechado.",
        activeDescription:
          "Você recebe as mensagens novas com o nome e a foto do contato, mesmo com o app fechado.",
        enable: "Ativar",
        enabled: "Ativadas",
        enableOnPhone: "Ativar notificações",
        enabledToast: "Notificações ativadas neste aparelho",
        blocked:
          "As notificações estão bloqueadas. Libere nas configurações do navegador ou do celular.",
        failed: "Não foi possível ativar as notificações agora. Tente de novo.",
        unsupported: "Este navegador não recebe notificações push.",
        iosHint:
          "No iPhone, adicione o sistema à Tela de Início (Compartilhar > Adicionar à Tela de Início) e abra por lá para ativar."
      },
      quickReplies: {
        title: "Respostas rápidas",
        search: "Buscar por atalho ou texto",
        empty:
          "Nenhuma resposta rápida ainda. Crie a primeira para usar nas conversas.",
        emptySearch: "Nenhuma resposta encontrada.",
        use: "Usar esta resposta",
        edit: "Editar",
        delete: "Excluir",
        deleteTitle: "Excluir resposta rápida?",
        deleteMessage:
          "Ela deixa de aparecer para a equipe. Essa ação não pode ser desfeita.",
        add: "Nova resposta",
        close: "Fechar",
        added: "Resposta rápida criada",
        updated: "Resposta rápida atualizada",
        deleted: "Resposta rápida excluída"
      },
      ticketActions: {
        spy: "Espiar conversa",
        close: "Encerrar conversa",
        noQueue: "Sem fila"
      },
      expressions: {
        searchEmoji: "Buscar emoji",
        recent: "Recentes",
        frequent: "Mais usados",
        emojiResults: "Resultados",
        noEmoji: "Nenhum emoji encontrado",
        emojiCategories: {
          people: "Carinhas e pessoas",
          nature: "Animais e natureza",
          foods: "Comidas e bebidas",
          activity: "Atividades",
          places: "Viagens e lugares",
          objects: "Objetos",
          symbols: "Símbolos",
          flags: "Bandeiras"
        },
        title: "Emoji, figurinhas e GIFs",
        emoji: "Emoji",
        stickers: "Figurinhas",
        gifs: "GIFs",
        searchStickers: "Buscar figurinhas",
        searchGifs: "Buscar GIFs",
        noStickers:
          "As figurinhas que chegarem nas conversas aparecem aqui para você reenviar.",
        noGifs: "Nenhum GIF encontrado.",
        gifsNotConfigured:
          "Para usar GIFs, adicione a chave do GIPHY em Configurações > Opções > Serviços externos.",
        sendSticker: "Enviar figurinha",
        sendGif: "Enviar GIF"
      },
      about: {
        headline: "Feita para atender melhor, todos os dias",
        product:
          "O vuup.me é uma plataforma de atendimento pelo WhatsApp que reúne a equipe em um só lugar: conversas, filas, chatbot, Kanban e chat interno.",
        founder:
          "Eu sou o David Fernandes, tenho 22 anos e empreendo na área de tecnologia.",
        improving:
          "Estou sempre melhorando o vuup.me: cada atualização traz ajustes e novidades para deixar o dia a dia de quem atende mais simples.",
        founderRole: "Fundador do vuup.me",
        license: "Software livre sob a licença AGPL-3.0.",
        sourceCode: "Código-fonte",
        aboutthe: "Sobre a",
        copyright: "© 2024 - Funcionando com vuup.me",
        buttonclose: "Fechar",
        title: "Sobre o vuup.me",
        abouttitle: "Origem e melhorias",
        aboutdetail:
          "O vuup.me é derivado indireto do projeto Whaticket com melhorias compartilhadas pelos desenvolvedores do sistema EquipeChat através do canal VemFazer no youtube, posteriormente melhoradas por Claudemir Todo Bom",
        aboutauthorsite: "Site do autor",
        aboutwhaticketsite: "Site do Whaticket Community no Github",
        aboutvemfazersite: "Site do canal Vem Fazer no Github",
        licenseheading: "Licença em Código Aberto",
        licensedetail:
          "O vuup.me está licenciado sob a GNU Affero General Public License versão 3, isso significa que qualquer usuário que tiver acesso a esta aplicação tem o direito de obter acesso ao código fonte. Mais informações nos links abaixo:",
        licensefulltext: "Texto completo da licença",
        licensesourcecode: "Código fonte do vuup.me"
      },
      schedules: {
        calendar: {
          subtitle: "Veja no calendário quando cada mensagem será enviada.",
          today: "Hoje",
          list: "Lista",
          month: "Mês",
          all: "Todos",
          pending: "Agendada",
          sent: "Enviada",
          error: "Com erro",
          more: "mais",
          noEvents: "Nenhum agendamento neste mês.",
          noEventsDay: "Nada agendado neste dia",
          scheduleThisDay: "Agendar neste dia",
          previous: "Mês anterior",
          next: "Próximo mês",
          count: "{{count}} agendamento",
          count_plural: "{{count}} agendamentos"
        },
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir este Agendamento?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          contact: "Contato",
          body: "Mensagem",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          status: "Status",
          actions: "Ações"
        },
        buttons: {
          add: "Novo Agendamento"
        },
        toasts: {
          deleted: "Agendamento excluído com sucesso."
        }
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir esta Tag?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Tickets",
          contacts: "Contatos",
          actions: "Ações",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nova Tag"
        },
        toasts: {
          deleted: "Tag excluído com sucesso."
        }
      },
      whitelabel: {
        primaryColorLight: "Cor primária clara",
        primaryColorDark: "Cor primária escura",
        lightLogo: "Logo do app claro",
        darkLogo: "Logo do app escuro",
        favicon: "Favicon do app",
        appname: "Nome do app",
        logoHint: "Prefira SVG e aspecto de 28:10",
        faviconHint: "Prefira imagem SVG quadrada ou PNG 512x512",
        loginLinks: "Links do login",
        loginLinksHint:
          "Adicione pares de título e URL para exibir abaixo da caixa de login no desktop e no mobile.",
        linkTitle: "Título do link",
        linkUrl: "URL do link",
        removeLink: "Remover link",
        sidePanelImage: "Imagem lateral do login",
        sidePanelImageHint:
          "Exibida no lado esquerdo do formulário de login em telas desktop.",
        backgroundContent: "Conteúdo de fundo do login",
        backgroundContentHint:
          "Aceita imagens, arquivos SVG e vídeos MP4 para o fundo da tela de login.",
        noFileSelected: "Nenhum arquivo selecionado ainda.",
        buildExtension: "Construir extensão WA Session Capture",
        buildingExtension: "Construindo extensão…",
        downloadExtension: "Baixar extensão",
        extensionHint:
          "Constrói uma extensão Chrome personalizada. O ZIP baixado já contém os arquivos da extensão: extraia e carregue a pasta extraída como extensão descompactada.",
        extensionBuildStarted:
          "Construção da extensão iniciada. Você será notificado quando estiver pronta.",
        extensionBuildFailed:
          "Não foi possível iniciar a construção da extensão.",
        extensionBuilt: "Extensão construída com sucesso.",
        extensionBuildUnknownError: "Erro desconhecido na construção."
      },
      settings: {
        klipyApiKey: {
          title: "Chave da API do KLIPY"
        },
        giphyApiKey: {
          title: "Chave do GIPHY (GIFs)"
        },
        hints: {
          klipyKey:
            "Chave gratuita do klipy.com (o mesmo acervo de GIFs e figurinhas usado pelo Discord). Com ela, a busca de GIFs e figurinhas do chat usa o KLIPY; sem ela, usa o GIPHY.",
          giphyKey:
            "Chave grátis criada em developers.giphy.com. Com ela, a equipe busca e envia GIFs pelo chat.",
          groups: {
            general: "Como o atendimento funciona no dia a dia.",
            timeouts:
              "O que o sistema faz sozinho quando uma conversa fica parada. Tempos em minutos; 0 desliga.",
            officeHours:
              "Horário de funcionamento e o que acontece com as mensagens que chegam fora dele.",
            groups: "Como tratar as conversas de grupos do WhatsApp.",
            confidenciality:
              "O que cada atendente enxerga das conversas de outras filas.",
            api: "Chave para sistemas externos consultarem os contatos pela API.",
            externalServices:
              "Inteligência artificial para transcrever áudios e a chave do GIPHY para enviar GIFs.",
            serveradmin:
              "Opções da instalação inteira: valem para todas as empresas."
          },
          ratings:
            "Ao encerrar o atendimento, o cliente recebe um pedido para dar uma nota ao atendimento.",
          calls:
            "Quando o cliente liga pelo WhatsApp: ignorar a ligação ou responder avisando que não atendemos por chamada.",
          chatbotAutoExit:
            "Se o cliente digitar algo que não é uma opção do menu, a conversa sai do chatbot e segue para a fila.",
          quickMessages:
            "Respostas rápidas compartilhadas com toda a empresa ou só de cada usuário.",
          tagsMode:
            "Onde as tags ficam: no atendimento (acabam quando ele é encerrado), no contato (acompanham a pessoa) ou nos dois.",
          numericIcons:
            "No menu do chatbot, mostra as opções como 1️⃣ 2️⃣ 3️⃣ em vez de números comuns.",
          ticketAccepted:
            "Enviada ao cliente quando um atendente aceita a conversa. Deixe em branco para não enviar.",
          transfer:
            "Enviada ao cliente quando a conversa é transferida. Deixe em branco para não enviar.",
          ratingsTimeout:
            "Quanto tempo o cliente tem para responder a avaliação. Depois disso, o pedido expira.",
          autoReopen:
            "Se o cliente escrever de novo dentro desse tempo após o encerramento, o mesmo atendimento é reaberto. 0 desliga.",
          noQueueTimeout:
            "Conversas aguardando sem fila por mais tempo que isso recebem a ação escolhida ao lado. 0 desliga.",
          noQueueTimeoutAction:
            "O que fazer com a conversa sem fila que ficou parada: encerrar ou mandar para uma fila.",
          openTicketTimeout:
            "Conversas em atendimento sem nenhuma mensagem por esse tempo recebem a ação escolhida ao lado. 0 desliga.",
          openTicketTimeoutAction:
            "O que fazer com a conversa em atendimento que ficou parada: devolver para a fila ou encerrar.",
          chatbotTimeout:
            "Se o cliente parar de responder o chatbot por esse tempo, a ação escolhida ao lado é aplicada. 0 desliga.",
          chatbotTimeoutAction:
            "O que fazer quando o cliente abandona o chatbot: encerrar ou mandar para uma fila.",
          officeHours:
            "Liga o controle de horário de funcionamento, com horários da empresa inteira ou de cada fila.",
          outOfHours:
            "O que acontece com as mensagens que chegam fora do horário: ficam aguardando ou o atendimento é encerrado.",
          ignoreGroups:
            "Ativado, as mensagens de grupos do WhatsApp não viram atendimento.",
          soundGroups: "Toca o aviso sonoro também para mensagens de grupos.",
          groupsTab:
            "Separa as conversas de grupos em uma aba própria em Atendimentos.",
          messageVisibility:
            "Respeitar fila da mensagem: cada atendente só vê as mensagens trocadas nas filas dele. Respeitar fila do ticket: vê todo o histórico do atendimento.",
          keepQueueAndUser:
            "Ativado, o atendimento encerrado guarda a fila e o atendente. Desativado, os dois são removidos ao encerrar.",
          apiToken:
            "Chave usada por sistemas externos para consultar os contatos pela API. Gere, copie e guarde em local seguro.",
          aiProvider:
            "Serviço de inteligência artificial que faz a transcrição dos áudios.",
          aiKey: "Chave de acesso do serviço escolhido ao lado.",
          audioTranscriptions:
            'Mostra "transcrever" nos áudios da conversa. O áudio só vira texto quando alguém clica.',
          allowSignup:
            "Permite que novas empresas criem conta sozinhas pela página de cadastro.",
          multithread:
            "Roda as conexões do WhatsApp em processos separados. Ajuda em servidores com muitas conexões.",
          uploadLimit:
            "Tamanho máximo, em MB, dos arquivos que a equipe envia.",
          downloadLimit:
            "Tamanho máximo, em MB, dos arquivos recebidos que o sistema baixa. Acima disso, o cliente é avisado.",
          gracePeriod:
            "Por quantos dias uma empresa ainda usa o sistema depois do vencimento, antes de ser bloqueada."
        },
        saving: "Salvando…",
        appearance: {
          tab: "Aparência",
          title: "Tema de cores",
          subtitle:
            "Escolha as cores do sistema para toda a sua equipe. A mudança aparece na hora, na tela de todos.",
          mode: "Modo",
          light: "Claro",
          dark: "Escuro",
          custom: "Personalizado",
          customDescription: "Use a cor da sua marca",
          restore: "Restaurar padrão",
          applied: "Tema aplicado",
          restored: "Cores padrão restauradas",
          current: "Em uso",
          presets: {
            tekvosoft: {
              name: "Preto e branco",
              description: "A identidade padrão do vuup.me: limpa e neutra"
            },
            brandPurple: {
              name: "Roxo",
              description: "Violeta vibrante e moderno"
            },
            classicBlue: {
              name: "Azul Clássico",
              description: "Azul profissional, sóbrio e confiável"
            },
            forestGreen: {
              name: "Verde Floresta",
              description:
                "Verde inspirado na natureza, para um visual tranquilo"
            },
            oceanTeal: {
              name: "Verde Oceano",
              description: "Azul-petróleo refrescante, inspirado no mar"
            },
            sunsetOrange: {
              name: "Laranja Pôr do Sol",
              description: "Tons quentes de laranja e âmbar"
            },
            nightPurple: {
              name: "Roxo Noturno",
              description: "Roxo profundo e elegante"
            },
            roseRed: {
              name: "Rosa Rosé",
              description: "Rosa intenso para um visual sofisticado"
            },
            cosmic: {
              name: "Cósmico",
              description: "Índigo inspirado no espaço profundo"
            }
          }
        },
        restartBackend: {
          button: "Reiniciar Backend",
          restarting: "Reiniciando…",
          success: "Reinicialização do backend iniciada.",
          error: "Falha ao reiniciar o backend."
        },
        group: {
          general: "Geral",
          timeouts: "Tempos de espera",
          officeHours: "Horário de expediente",
          groups: "Grupos",
          confidenciality: "Confidencialidade",
          api: "API",
          externalServices: "Serviços externos",
          serveradmin: "Administração do servidor"
        },
        success: "Configurações salvas com sucesso.",
        copiedToClipboard: "Copiado para a área de transferência",
        title: "Configurações",
        chatbotTicketTimeout: "Timeout do chatbot (minutos)",
        chatbotTicketTimeoutAction: "Ação do timeout do chatbot",
        settings: {
          userCreation: {
            name: "Criação de usuário",
            options: {
              enabled: "Ativado",
              disabled: "Desativado"
            }
          }
        },
        validations: {
          title: "Avaliações",
          options: {
            enabled: "Habilitado",
            disabled: "Desabilitado"
          }
        },
        OfficeManagement: {
          title: "Gerenciamento de Expediente",
          options: {
            disabled: "Desabilitado",
            ManagementByDepartment: "Gerenciamento Por Fila",
            ManagementByCompany: "Gerenciamento Por Empresa"
          }
        },
        outOfHoursAction: {
          title: "Ação fora do expediente",
          options: {
            pending: "Deixar como pendente",
            closed: "Fechar ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignorar Mensagens de Grupos",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        soundGroupNotifications: {
          title: "Notificações de som de grupo",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        groupsTab: {
          title: "Aba de Grupos",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        VoiceAndVideoCalls: {
          title: "Chamadas de Voz e Vídeo",
          options: {
            enabled: "Ignorar",
            disabled: "informar indisponibilidade"
          }
        },
        AutomaticChatbotOutput: {
          title: "Saída automática de chatbot",
          options: {
            enabled: "Activado",
            disabled: "Desativado"
          }
        },
        ShowNumericEmoticons: {
          title: "Exibir emojis numéricos na fila",
          options: {
            enabled: "Activado",
            disabled: "Desativado"
          }
        },
        QuickMessages: {
          title: "Mensagens Rápidas",
          options: {
            enabled: "Por empresa",
            disabled: "Por Usuário"
          }
        },
        AllowRegistration: {
          title: "Permitir cadastro",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        MultiThreadedWbot: {
          title: "Worker Multithread do WhatsApp",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        FileUploadLimit: {
          title: "Limite de Upload de arquivos (MB)"
        },
        FileDownloadLimit: {
          title: "Limite de Download de arquivos (MB)"
        },
        messageVisibility: {
          title: "Visibilidade da mensagem",
          options: {
            respectMessageQueue: "Respeitar fila da mensagem",
            respectTicketQueue: "Respeitar fila do ticket"
          }
        },
        keepQueueAndUser: {
          title: "Manter fila e usuário no ticket fechado",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        GracePeriod: {
          title: "Carência após vencimento (dias)"
        },
        ticketAcceptedMessage: {
          title: "Mensagem de ticket aceito",
          placeholder: "Digite sua mensagem de ticket aceito aqui"
        },
        transferMessage: {
          title: "Mensagem de transferência",
          placeholder: "Digite sua mensagem de transferência aqui"
        },
        mustacheVariables: {
          title: "Variáveis disponíveis:"
        },
        WelcomeGreeting: {
          greetings: "Olá",
          welcome: "Seja bem-vindo a",
          expirationTime: "Ativo até"
        },
        Options: {
          title: "Opções"
        },
        Companies: {
          title: "Empresas"
        },
        schedules: {
          title: "Horários",
          updateToNewFormat: "Atualizar para novo formato"
        },
        Plans: {
          title: "Planos",
          public: "Público",
          usersLimit: "Limite de usuários",
          connectionsLimit: "Limite de conexões",
          queuesLimit: "Limite de filas",
          currencyCode: "Código da Moeda (ISO 4217)"
        },
        Help: {
          title: "Ajuda"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Payment gateways"
        },
        i18nSettings: {
          title: "Traduções"
        },
        AIProvider: {
          title: "Serviço de IA"
        },
        AudioTranscriptions: {
          title: "Transcrição de áudio"
        },
        TagsMode: {
          title: "Modo de Tags",
          options: {
            ticket: "Ticket",
            contact: "Contato",
            both: "Ticket e Contacto"
          }
        },
        docker: {
          title: "Containers Docker",
          description:
            "Gerencie os containers do servidor: verifique atualizações de imagem, pull+reinicie ou reinicie.",
          selfBadge: "este backend",
          notChecked: "Não verificado",
          updateAvailable: "Atualização disponível",
          upToDate: "Atualizado",
          unavailable: "Indisponível",
          unavailableMessage:
            "Serviço Docker indisponível neste servidor. Verifique se o socket do Docker está montado no container do backend.",
          columns: {
            name: "Nome",
            image: "Imagem",
            state: "Estado",
            created: "Criado em",
            update: "Atualização",
            actions: "Ações"
          },
          actions: {
            refreshList: "Atualizar lista",
            checkUpdates: "Verificar atualizações",
            checkUpdate: "Verificar atualização",
            updateBackendFrontend: "Atualizar backend e frontend",
            updatingBackendFrontend: "Atualizando backend e frontend...",
            update: "Pull + reiniciar",
            restart: "Reiniciar"
          },
          toasts: {
            updateAvailable: "Atualização disponível para {{name}}",
            selfUpdate:
              "O backend está sendo atualizado e será reiniciado. Aguarde alguns instantes e recarregue a página.",
            selfRestart:
              "O backend está reiniciando. Aguarde alguns instantes e recarregue a página.",
            restarted: "{{name}} reiniciado",
            noUpdates: "Nenhuma atualização disponível."
          },
          confirm: {
            updateTitle: "Atualizar {{name}}",
            updateAllTitle: "Atualizar backend e frontend",
            updateAllBody:
              "Os containers do backend e frontend serão atualizados (pull + recriação). O container do backend será reiniciado e a aplicação ficará indisponível por alguns instantes. Deseja continuar?",
            restartTitle: "Reiniciar {{name}}",
            updateBody:
              'Será feito o pull da imagem "{{image}}" e o container será recriado com a nova versão. Deseja continuar?',
            restartBody:
              'O container "{{name}}" será reiniciado. Deseja continuar?',
            selfWarning:
              "Este é o container do backend: a aplicação ficará indisponível por alguns instantes."
          },
          dashboardBanner: {
            title: "Atualizações de containers disponíveis",
            description:
              "Atualizações de imagem do backend e/ou frontend estão disponíveis.",
            updateAll: "Atualizar backend e frontend",
            updating: "Atualizando...",
            confirmBody:
              "Os containers do backend e frontend serão atualizados (pull + recriação). O container do backend será reiniciado e a aplicação ficará indisponível por cerca de 1 minuto. Deseja continuar?"
          }
        }
      },
      messagesList: {
        transcribe: {
          action: "transcrever",
          loading: "transcrevendo…"
        },
        history: {
          load: "Recuperar histórico de mensagens",
          more: "Carregar mensagens mais antigas",
          none: "Não há mensagens anteriores deste contato",
          ticket: "Atendimento anterior #{{id}}",
          current: "Início deste atendimento"
        },
        reactions: {
          react: "Reagir",
          copy: "Copiar",
          copied: "Mensagem copiada",
          more: "Mais opções",
          you: "Você"
        },
        header: {
          assignedTo: "Atribuído à:",
          tapForInfo: "Toque para ver os dados do contato",
          buttons: {
            return: "Retornar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceitar",
            call: "Chamar",
            endCall: "Encerrar Chamada"
          }
        },
        openPaymentLink: "Abrir link de pagamento"
      },
      messagesInput: {
        linkPreview: {
          loading: "Carregando prévia do link…",
          remove: "Enviar sem prévia"
        },
        phone: {
          attach: "Anexar",
          camera: "Câmera",
          gallery: "Fotos e vídeos",
          document: "Documento",
          quickReplies: "Respostas rápidas",
          signature: "Assinatura",
          on: "Ligada",
          off: "Desligada",
          recording: "Gravando",
          discardAudio: "Apagar áudio",
          sendAudio: "Enviar áudio"
        },
        placeholderOpen: "Digite uma mensagem",
        placeholderClosed:
          "Reabra ou aceite esse ticket para enviar uma mensagem.",
        signMessage: "Assinar",
        replying: "Respondendo",
        editing: "Editando"
      },
      message: {
        edited: "Editada",
        forwarded: "Encaminhada"
      },

      contactDrawer: {
        group: {
          header: "Dados do grupo",
          kind: "Grupo",
          members: "{{count}} membro",
          members_plural: "{{count}} membros",
          actionSearch: "Pesquisar",
          actionMembers: "Membros",
          search: "Pesquisar membros",
          you: "Você",
          admin: "Admin do grupo",
          showAll: "Ver todos ({{count}})",
          showMore: "Ver mais",
          readMore: "Ler mais",
          readLess: "Ver menos",
          noResults: "Nenhum membro encontrado",
          leave: "Sair do grupo",
          leaveConfirmTitle: "Sair deste grupo?",
          leaveConfirmText:
            "A conexão sai do grupo no WhatsApp e deixa de receber as mensagens dele. Para voltar, será preciso um link de convite.",
          left: "Você saiu do grupo",
          notMember: "A conexão não participa mais deste grupo.",
          join: "Entrar no grupo",
          joinTitle: "Entrar pelo link de convite",
          joinLink: "Link de convite",
          joinHint: "Cole o link de convite deste grupo (chat.whatsapp.com/…).",
          joined: "Pronto! A conexão voltou para o grupo."
        },
        media: {
          title: "Mídia, links e docs",
          media: "Mídia",
          docs: "Docs",
          links: "Links",
          empty_media: "Nenhuma foto ou vídeo trocado com este contato.",
          empty_docs: "Nenhum documento trocado com este contato.",
          empty_links: "Nenhum link trocado com este contato.",
          loadMore: "Carregar mais"
        },
        phone: {
          edit: "Editar",
          call: "Ligar",
          copy: "Copiar",
          copied: "Número copiado",
          copyFailed: "Não foi possível copiar o número",
          schedule: "Agendar",
          notes: "Observações",
          email: "E-mail",
          tags: "Tags",
          none: "Nenhuma",
          queue: "Fila",
          noQueue: "Sem fila",
          attendant: "Atendente",
          unassigned: "Sem atendente",
          connection: "Conexão",
          ticket: "Atendimento",
          status: {
            open: "Em atendimento",
            pending: "Aguardando",
            closed: "Resolvido",
            group: "Grupo"
          }
        },
        header: "Dados do contato",
        buttons: {
          edit: "Editar contato"
        },
        extraInfo: "Outras informações"
      },
      ticketOptionsMenu: {
        schedule: "Agendamento",
        delete: "Deletar",
        transfer: "Transferir",
        appointmentsModal: {
          title: "Observações do Atendimento",
          textarea: "Observação",
          placeholder: "Insira aqui a informação que deseja registrar"
        },
        confirmationModal: {
          title: "Deletar o ticket do contato",
          message:
            "Atenção! Todas as mensagens relacionadas ao ticket serão perdidas."
        },
        buttons: {
          delete: "Excluir",
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
        delete: "Deletar",
        edit: "Editar",
        forward: "Encaminhar",
        history: "Histórico",
        reply: "Responder",
        confirmationModal: {
          title: "Apagar mensagem?",
          message: "Esta ação não pode ser revertida."
        }
      },
      messageHistoryModal: {
        close: "Fechar",
        title: "Histórico de edição da mensagem"
      },
      presence: {
        unavailable: "Indisponível",
        available: "Disponível",
        composing: "Digitando...",
        recording: "Gravando...",
        paused: "Pausado"
      },
      privacyModal: {
        success: "Privacidade atualizada",
        title: "Editar Privacidade do Whatsapp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Salvar"
        },
        form: {
          menu: {
            all: "Todos",
            none: "Ninguém",
            contacts: "Meus contatos",
            contact_blacklist: "Contatos selecionados",
            match_last_seen: "Semelhante ao Visto por Último",
            known: "Conhecidos",
            disable: "Desativada",
            hrs24: "24 Horas",
            dias7: "7 Dias",
            dias90: "90 Dias"
          },
          readreceipts: "Para atualizar a privacidade dos recibos de leitura",
          profile: "Para atualizar a privacidade da foto do perfil",
          status: "Para atualizar a privacidade do recados",
          online: "Para atualizar a privacidade online",
          last: "Para atualizar a privacidade do Último Visto",
          groupadd: "Para atualizar a privacidade de Adicionar a grupos",
          calladd: "Para atualizar a privacidade de Adicionar a Ligações",
          disappearing: "Para atualizar o Modo de Desaparecimento Padrão"
        }
      },
      phoneNumberInput: {
        country: "País",
        phoneNumber: "Telefone",
        localNumber: "Telefone"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR: "Erro de configuração. Por favor, contate o suporte.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Relógio fora de sincronia. Por favor, verifique as configurações de data e hora do seu dispositivo.",
        ERR_BACKEND_UNREACHABLE:
          "Backend inacessível. Por favor, tente novamente mais tarde.",
        ERR_BACKEND_NOT_READY:
          "O backend está iniciando e ainda não está pronto. Tentando novamente automaticamente."
      },
      backendErrors: {
        ERR_CODE_NOT_SENT:
          "Não foi possível enviar o código para o seu e-mail. Tente de novo em instantes.",
        ERR_CODE_EXPIRED: "O código expirou. Entre de novo para receber outro.",
        ERR_CODE_INVALID: "Código incorreto. Confira o e-mail e tente de novo.",
        ERR_WAIT_TO_RESEND: "Aguarde alguns segundos para pedir outro código.",
        ERR_EMAIL_DISABLED:
          "O envio de e-mails não está configurado. Fale com o administrador.",
        ERR_RESET_LINK_EXPIRED:
          "Este link expirou ou já foi usado. Peça um novo.",
        ERR_PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 6 caracteres.",
        ERR_NOT_A_GROUP: "Esta conversa não é de um grupo.",
        ERR_GROUP_LEAVE: "Não foi possível sair do grupo agora. Tente de novo.",
        ERR_INVALID_INVITE: "Link de convite inválido ou expirado.",
        ERR_INVITE_OTHER_GROUP: "Esse link é de outro grupo.",
        ERR_INVALID_ADDRESS: "Endereço inválido. Confira o CEP e o número.",
        ERR_TRANSCRIPTION_DISABLED:
          "Transcrição de áudio desativada ou sem chave de IA configurada.",
        ERR_TRANSCRIPTION_FAILED: "Não foi possível transcrever o áudio.",
        ERR_NOT_AUDIO: "Essa mensagem não é um áudio.",
        ERR_INTERNAL: "Erro interno do servidor. Por favor, contate o suporte.",
        ERR_UNAUTHORIZED: "Você não está autorizado a acessar este recurso.",
        ERR_FORBIDDEN: "Você não tem permissão para acessar este recurso.",
        ERR_CHECK_NUMBER: "Número não encontrado no Whatsapp.",
        ERR_NO_OTHER_WHATSAPP: "Deve haver pelo menos um WhatsApp padrão.",
        ERR_NO_DEF_WAPP_FOUND:
          "Nenhum WhatsApp padrão encontrado. Verifique a página de conexões.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sessão do WhatsApp não foi inicializada. Verifique a página de conexões.",
        ERR_WAPP_CHECK_CONTACT:
          "Não foi possível verificar o contato do WhatsApp. Verifique a página de conexões",
        ERR_WAPP_INVALID_CONTACT: "Este não é um número de Whatsapp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Não foi possível baixar mídia do WhatsApp. Verifique a página de conexões.",
        ERR_USER_INACTIVE:
          "Seu acesso está desativado. Fale com o administrador da sua empresa.",
        ERR_INVALID_CREDENTIALS:
          "Erro de autenticação. Por favor, tente novamente.",
        ERR_SENDING_WAPP_MSG:
          "Erro ao enviar mensagem do WhatsApp. Verifique a página de conexões.",
        ERR_DELETE_WAPP_MSG: "Não foi possível excluir a mensagem do WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Não foi possível editar a mensagem do WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Já existe um tíquete aberto para este contato.",
        ERR_SESSION_EXPIRED: "Sessão expirada. Por favor entre.",
        ERR_USER_CREATION_DISABLED:
          "A criação do usuário foi desabilitada pelo administrador.",
        ERR_NO_PERMISSION: "Você não tem permissão para acessar este recurso.",
        ERR_TOO_MANY_ATTEMPTS:
          "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
        ERR_DUPLICATED_CONTACT: "Já existe um contato com este número.",
        ERR_NO_SETTING_FOUND: "Nenhuma configuração encontrada com este ID.",
        ERR_NO_CONTACT_FOUND: "Nenhum contato encontrado com este ID.",
        ERR_NO_TICKET_FOUND: "Nenhum tíquete encontrado com este ID.",
        ERR_NO_USER_FOUND: "Nenhum usuário encontrado com este ID.",
        ERR_NO_WAPP_FOUND: "Nenhum WhatsApp encontrado com este ID.",
        ERR_CREATING_MESSAGE: "Erro ao criar mensagem no banco de dados.",
        ERR_CREATING_TICKET: "Erro ao criar tíquete no banco de dados.",
        ERR_FETCH_WAPP_MSG:
          "Erro ao buscar a mensagem no WhtasApp, talvez ela seja muito antiga.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Esta cor já está em uso, escolha outra.",
        ERR_WAPP_GREETING_REQUIRED:
          "A mensagem de saudação é obrigatório quando há mais de uma fila.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Assinatura inválida ou não encontrada",
        ERR_WAPP_NOT_FOUND: "Conexão indisponível",
        ERR_SUBSCRIPTION_EXPIRED: "Assinatura expirada",
        ERR_UNKOWN: "Erro desconhecido"
      },
      phoneCall: {
        hangup: "Desligar"
      },
      wavoipModal: {
        title: "Insira o token da sua conexão no Wavoip",
        instructions:
          "Acessando o endereço abaixo você pode criar uma conta com 50 ligações gratuitas para teste"
      },
      openHours: {
        title: "Horários de Funcionamento",
        timezone: {
          placeholder: "Selecione o fuso horário",
          searchPlaceholder: "Digite para buscar...",
          selected: "Fuso horário selecionado"
        },
        tabs: {
          weekly: "Horários Semanais",
          overrides: "Exceções e Feriados"
        },
        weekly: {
          title: "Horários de Funcionamento Semanais",
          description:
            "Configure os horários regulares de funcionamento para cada dia da semana.",
          rule: "Regra",
          empty: "Sem horário definido: a fila atende a qualquer hora e ninguém recebe aviso de fora do expediente.",
          useDefault: "Usar segunda a sexta, das 9h às 18h",
          days: "Dias da Semana",
          hours: "Horários",
          closedMessage: "Fechado (sem horários definidos)",
          addHour: "Adicionar Horário",
          addRule: "Adicionar Nova Regra Semanal",
          from: "De",
          to: "Até",
          until: "até"
        },
        overrides: {
          title: "Exceções e Feriados",
          description:
            "Configure datas específicas com horários especiais ou fechamentos (feriados, eventos, etc.).",
          exception: "Exceção",
          date: "Data",
          label: "Descrição",
          labelPlaceholder: "Ex: Natal, Carnaval...",
          repeat: "Repetição",
          repeatNone: "Não repetir",
          repeatYearly: "Anual",
          closedDay: "Fechado neste dia",
          specialHours: "Horários Especiais",
          addHour: "Adicionar Horário",
          addException: "Adicionar Exceção ou Feriado",
          from: "De",
          to: "Até",
          until: "até"
        },
        days: {
          mon: "Segunda",
          tue: "Terça",
          wed: "Quarta",
          thu: "Quinta",
          fri: "Sexta",
          sat: "Sábado",
          sun: "Domingo"
        }
      }
    }
  }
};

export { messages };
