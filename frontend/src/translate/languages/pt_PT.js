const messages = {
  pt_PT: {
    translations: {
      paywall: {
        changeTitle: "Vamos mudar de plano?",
        changeText:
          "Aumente ou diminua quando quiser. No upgrade paga o novo plano agora; no downgrade nada é cobrado hoje — a próxima cobrança já vem com o valor novo.",
        currentBadge: "O SEU PLANO ATUAL",
        upgradeBadge: "UPGRADE ↑",
        downgradeBadge: "DOWNGRADE ↓",
        currentBtn: "Plano atual",
        upgradeBtn: "Fazer upgrade",
        downgradeBtn: "Mudar para este plano",
        changedTitle: "Plano alterado!",
        changedText:
          "Agora está no {{plan}}. A próxima cobrança, a {{date}}, já vem com o novo valor.",
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
        reconnected: "Ligado novamente",
        server: "Servidor sem resposta, a tentar novamente…",
        reconnecting: "A religar…",
        sending: "A enviar ficheiro…",
        loading: "A carregar…",
        slow: "Ligação lenta",
        backOnline: "Internet de volta 🎉",
        offlineTitle: "A internet foi tomar um café",
        offlineText:
          "Já assobiámos para o router, mas ele não respondeu. Assim que ela voltar, continuamos exatamente de onde parou.",
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
          connections: "Caixa de entrada",
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
        connections: "Caixa de entrada",
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
        connections: "Caixa de entrada",
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
        pageTitle: "A Minha Subscrição",
        pageSubtitle: "Gira o seu plano, pagamento e histórico num só lugar.",
        currentPlan: "Subscrição atual",
        planBenefits: "Benefícios do plano",
        noPlan: "Sem plano",
        valuePaid: "Valor pago",
        planValue: "Valor do plano",
        expiresOn: "Expira em",
        expiredOn: "Expirou em",
        upgradeTitle: "Evolua o seu plano para",
        upgradeText:
          "Com o upgrade, passa para {{users}} utilizadores e {{connections}} ligações e desbloqueia novos recursos para a sua operação.",
        upgradeBtn: "Fazer upgrade",
        historyTitle: "Histórico de pagamentos",
        seeAll: "Ver tudo",
        seeLess: "Ver menos",
        statusPaid: "Aprovado",
        renewalTitle: "Renovação",
        cardActive: "Ativo",
        cardPaused: "Em pausa",
        cardExpires: "Expira {{date}}",
        cardSaved: "Cartão guardado",
        cardMenu: "Opções do cartão",
        cardRemove: "Remover cartão",
        cardRemoveConfirm:
          "Remover o cartão guardado? A renovação automática deixa de funcionar até guardar outro cartão.",
        autoRenewOn: "Renovação automática ligada",
        autoRenewOff: "Renovação automática desligada",
        cardNote: "Este cartão é usado para renovar a sua subscrição atual.",
        noCard: "Nenhum cartão guardado",
        noCardNote:
          'Ao pagar com cartão, marque "Guardar cartão" para renovar automaticamente.',
        addCard: "Adicionar cartão",
        addressTitle: "Morada",
        addressUpdate: "Atualizar morada",
        addressEmpty: "Nenhuma morada registada.",
        addressNumber: "n.º {{number}}",
        alertOpen: "Fatura de {{value}} em aberto",
        plansDialogTitle: "Planos e benefícios",
        close: "Fechar",
        address: {
          title: "Morada de faturação",
          postalCode: "Código postal",
          street: "Rua",
          number: "Número",
          complement: "Complemento",
          district: "Bairro",
          city: "Cidade",
          state: "UF",
          save: "Guardar",
          cancel: "Cancelar",
          saved: "Morada atualizada",
          cepNotFound: "Código postal não encontrado"
        },
        plansTitle: "Planos",
        perMonth: "/mês",
        planUsers: "{{count}} utilizador",
        planUsers_plural: "{{count}} utilizadores",
        planConnections: "{{count}} ligação",
        planConnections_plural: "{{count}} ligações",
        planQueues: "{{count}} fila",
        planQueues_plural: "{{count}} filas",
        planChat: "Chat interno",
        planSchedules: "Agendamentos",
        planApi: "API de integração",
        planCurrent: "O SEU PLANO",
        planYours: "Plano atual",
        planChoose: "Escolher este plano",
        planChoosing: "A preparar…",
        methodsTitle: "Formas de pagamento",
        methodPix: "Pix",
        methodCard: "Cartão de crédito",
        methodBoleto: "Referência",
        savedCardHint: "Cobrança automática todos os meses neste cartão.",
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
      common: {
        search: "Pesquisar",
        emptyTitle: "Nada por aqui ainda",
        emptyDescription: "Assim que houver registos, aparecem nesta lista.",
        emptySearchTitle: "Sem resultados",
        emptySearchDescription:
          "Nada corresponde à sua pesquisa. Tente outro termo.",
        filter: "Filtrar",
        edit: "Editar",
        delete: "Eliminar",
        cancel: "Cancelar",
        save: "Salvar",
        confirm: "Confirmar",
        confirmation: "Confirmação",
        areyousure: "Tem certeza?",
        close: "Fechar",
        back: "Voltar",
        today: "Hoje",
        yesterday: "Ontem",
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
        user: "Utilizador",
        users: "Utilizadores",
        connection: "Conexão",
        connections: "Caixa de entrada",
        queue: "Fila",
        queues: "Filas",
        contact: "Contacto",
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
        rating: "Classificação",
        transferTo: "Transferir para",
        key: "Chave",
        value: "Valor",
        validations: {
          required: "Este campo é obrigatório",
          short: "Valor demasiado curto",
          long: "Valor demasiado longo",
          invalid: "Valor inválido",
          invalidEmail: "Email inválido",
          invalidPhone: "Número de telefone inválido"
        },
        status: "Estado",
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
        title: "Registar",
        toasts: {
          success: "Utilizador criado com sucesso! Faça o seu login!!!",
          fail: "Erro ao criar utilizador. Verifique os dados fornecidos."
        },
        form: {
          source: "Como nos conheceu?",
          goal: "Principal objetivo",
          teamSize: "Tamanho da equipe",
          segment: "Segmento",
          name: "Nome",
          email: "Email",
          password: "Palavra-passe"
        },
        buttons: {
          submit: "Registar",
          login: "Já tem uma conta? Entre!"
        }
      },
      forgotPassword: {
        heading: "Esqueceu-se da palavra-passe?",
        subheading:
          "Indique o seu e-mail e enviaremos uma ligação para criar uma palavra-passe nova.",
        email: "E-mail",
        submit: "Enviar ligação",
        sentHeading: "Verifique o seu e-mail",
        sent: "Se existir uma conta com {{email}}, vai receber uma ligação para criar uma palavra-passe nova. É válida durante 30 minutos.",
        back: "Voltar ao início de sessão"
      },
      resetPassword: {
        heading: "Crie uma palavra-passe nova",
        subheading: "Use pelo menos 6 caracteres.",
        password: "Nova palavra-passe",
        confirm: "Repita a nova palavra-passe",
        submit: "Guardar palavra-passe",
        mismatch: "As palavras-passe não coincidem.",
        success: "Palavra-passe alterada. Entre com a nova.",
        invalid: "Esta ligação não é válida. Peça uma nova.",
        requestNew: "Pedir uma ligação nova"
      },
      login: {
        forgot: "Esqueci-me da palavra-passe",
        code: {
          heading: "Confirme que é você",
          subheading:
            "Enviámos um código de 6 dígitos para {{email}}. É válido durante 10 minutos.",
          label: "Código",
          submit: "Confirmar",
          resend: "Reenviar código",
          resendIn: "Reenviar em {{seconds}}s",
          resent: "Enviámos um código novo.",
          back: "Voltar",
          hint: "Depois disso, este navegador fica autorizado."
        },
        subheading: "Entre para continuar seus atendimentos.",
        heading: "Bem-vindo de volta",
        title: "Entrar",
        form: {
          email: "Email",
          password: "Palavra-passe"
        },
        buttons: {
          submit: "Entrar",
          register: "Não tem uma conta? Registe-se!"
        }
      },
      companies: {
        title: "Registar Empresa",
        form: {
          name: "Nome da Empresa",
          plan: "Plano",
          token: "Token",
          submit: "Registar",
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
          accessAs: "Aceder como",
          incrementDueDate: "+ Vencimento",
          user: "Utilizador"
        },
        table: {
          storage: "Armazenamento",
          campaigns: "Campanhas",
          createdAt: "Criada Em"
        },
        toasts: {
          loadError: "Não foi possível carregar a lista de registos",
          operationSuccess: "Operação realizada com sucesso",
          operationError: "Não foi possível realizar a operação",
          operationErrorDuplicate:
            "Não foi possível realizar a operação. Verifique se já existe uma empresa com o mesmo nome ou se os campos foram preenchidos corretamente"
        },
        confirmationModal: {
          deleteTitle: "Eliminação de Registo",
          deleteMessage: "Deseja realmente eliminar este registo?",
          impersonateTitle: "Aceder como",
          impersonateMessage: "Deseja aceder ao sistema como esta empresa?"
        }
      },
      auth: {
        toasts: {
          success: "Login efetuado com sucesso!"
        },
        token: "Token"
      },
      dashboard: {
        filter: {
          invalid: "Escolha um período válido para filtrar."
        },
        sections: {
          now: "Agora",
          nowHint: "Situação em tempo real",
          period: "No período",
          periodHint: "Números do intervalo escolhido",
          team: "Equipa",
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
        charts: {
          perDay: {
            title: "Atendimentos hoje: "
          }
        }
      },
      connections: {
        title: "Caixas de entrada",
        toasts: {
          deleted: "Conexão com o WhatsApp excluída com sucesso!"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Tem a certeza? Esta ação não pode ser revertida.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "Tem a certeza? Terá de ler o QR Code novamente para voltar a ligar. Nada é apagado no WhatsApp.",
          purge:
            "Apagar tudo desta ligação do sistema: atendimentos, mensagens, ficheiros e os contactos que só falaram por ela. Não é possível desfazer.",
          purgeOnDelete: "Eliminar todas as conversas da ligação",
          purgeOnDeleteHint:
            "Atendimentos, mensagens, ficheiros e os contactos que só falaram por ela. Não é possível desfazer.",
          closetTickets: "Fechar todos os atendimentos abertos desta conexão"
        },
        buttons: {
          add: "Adicionar caixa de entrada",
          disconnect: "Desconectar",
          tryAgain: "Tentar novamente",
          qrcode: "QR CODE",
          newQr: "Novo QR CODE",
          connecting: "A conectar"
        },
        toolTips: {
          disconnected: {
            title: "Falha ao iniciar sessão do WhatsApp",
            content:
              "Certifique-se de que o seu telemóvel está conectado à internet e tente novamente, ou solicite um novo QR Code"
          },
          qrcode: {
            title: "A aguardar leitura do QR Code",
            content:
              "Clique no botão 'QR CODE' e leia o QR Code com o seu telemóvel para iniciar a sessão"
          },
          connected: {
            title: "Conexão estabelecida!"
          },
          timeout: {
            title: "A conexão com o telemóvel foi perdida",
            content:
              "Certifique-se de que o seu telemóvel está conectado à internet e o WhatsApp está aberto, ou clique no botão 'Desconectar' para obter um novo QR Code"
          },
          passkey: {
            title: "Autenticação por passkey necessária",
            content:
              "Clique no botão de passkey e utilize a extensão do navegador para capturar a sessão autenticada do WhatsApp Web."
          },
          resetPasskey: "Reiniciar sessão passkey"
        },
        table: {
          name: "Nome",
          status: "Estado",
          lastUpdate: "Última atualização",
          default: "Padrão",
          actions: "Ações",
          session: "Sessão"
        }
      },
      trialBanner: {
        daysLeft: "O seu teste gratuito termina em {{count}} dias",
        tomorrow: "O seu teste gratuito termina amanhã",
        today: "O seu teste gratuito termina hoje",
        ended: "O seu teste gratuito terminou",
        cta: "Subscrever agora"
      },
      mediaPreview: {
        add: "Adicionar arquivo",
        captionPlaceholder: "Adicionar legenda…",
        position: "{{current}} de {{total}}",
        files: "ficheiros",
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
        subtitle: "Conversas com a sua equipa",
        newChat: "Nova conversa",
        emptyListTitle: "Ainda não há conversas",
        emptyListDescription:
          "Crie uma conversa e escolha quem da equipa participa.",
        selectTitle: "Selecione uma conversa",
        selectDescription:
          "Escolha uma conversa na lista ou comece uma nova com a sua equipa.",
        participants: "participantes",
        typeMessage: "Escreva uma mensagem",
        edit: "Editar",
        delete: "Eliminar",
        deleteTitle: "Eliminar conversa",
        deleteMessage: "Esta ação não pode ser desfeita. Confirmar?",
        you: "Você"
      },
      whatsappModal: {
        title: {
          add: "Adicionar caixa de entrada",
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
          "Utilize a extensão do navegador para capturar a sessão autenticada do WhatsApp Web e enviá-la ao servidor.",
        connectorNotFound:
          "Extensão não detetada. Instale a extensão de captura passkey e recarregue a página.",
        connectorReady:
          "Extensão detetada. Clique abaixo para se autenticar pelo WhatsApp Web.",
        startCapture: "Iniciar Captura",
        waitingForCapture: "A aguardar a captura da sessão do WhatsApp Web…",
        existingSession: "O WhatsApp Web já tem uma sessão para {{number}}.",
        captureExisting: "Capturar esta sessão",
        clearAndContinue: "Limpar sessão local e continuar",
        importSent: "Sessão capturada e enviada com sucesso.",
        importError: "Falha na captura: {{reason}}.",
        missingToken: "Token de captura em falta. Recarregue a página.",
        downloadExtension: "Transferir extensão de captura",
        installInstructions: "Como instalar",
        hideInstructions: "Ocultar instruções",
        instructionsIntro: "Siga os passos abaixo para instalar a extensão:",
        installStep1: "Transfira o ficheiro ZIP da extensão.",
        installStep2:
          "Descompacte o ficheiro ZIP para uma pasta no seu computador.",
        installStep3: "Abra o Google Chrome e aceda a chrome://extensions/.",
        installStep4:
          "Ative o Modo de programador com o botão no canto superior direito.",
        installStep5: 'Clique em "Carregar expandida".',
        installStep6:
          "Selecione a pasta extraída que contém os ficheiros da extensão.",
        installStep7: "A extensão está instalada e pronta a usar.",
        installStep8: "Recarregue esta página com F5 e tente ligar novamente."
      },
      contacts: {
        title: "Contactos",
        toasts: {
          imported:
            "Importação iniciada. Os contactos aparecem na lista dentro de instantes.",
          deleted: "Contacto excluído com sucesso!"
        },
        searchPlaceholder: "Pesquisar...",
        confirmationModal: {
          deleteTitle: "Eliminar",
          importTitlte: "Importar contactos",
          deleteMessage: "Interações relacionadas serão perdidas.",
          importMessage: "Deseja importar todos os contactos do telefone?"
        },
        buttons: {
          importCsv: "Importar de ficheiro CSV",
          exportCsv: "Exportar para CSV",
          import: "Importar Contactos",
          add: "Adicionar Contacto"
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
          add: "Adicionar contacto",
          edit: "Editar contacto"
        },
        form: {
          mainInfo: "Dados do contacto",
          extraInfo: "Informações adicionais",
          name: "Nome",
          number: "Número do WhatsApp",
          email: "Email",
          extraName: "Nome do campo",
          extraValue: "Valor",
          disableBot: "Desativar chatbot"
        },
        buttons: {
          addExtraInfo: "Adicionar informação",
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Contacto salvo com sucesso."
      },
      queueModal: {
        confirmationModal: {
          deleteTitle: "Eliminar ficheiro?",
          deleteMessage:
            "O ficheiro anexado será removido. Esta ação não pode ser desfeita."
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
          outOfHoursMessage: "Mensagem fora de expediente",
          ratingMessage: "Mensagem de avaliação",
          transferMessage: "Mensagem de Transferência",
          token: "Token"
        },
        toasts: {
          deleted: "Ficheiro removido",
          saved: "Fila salva com sucesso"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
          attach: "Anexar Ficheiro"
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
          add: "Adicionar utilizador",
          edit: "Editar utilizador"
        },
        listItems: {
          adminProfile: "Administrador",
          userProfile: "Usuário"
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Palavra-passe",
          profile: "Perfil"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },

        success: "Utilizador salvo com sucesso."
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
          contact: "Contacto",
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
        success: "Tag salva com sucesso.",
        successKanban: "Coluna salva com sucesso."
      },
      chat: {
        noTicketMessage: "Selecione um ticket para começar a conversar."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTE E SOLTE FICHEIROS NO CAMPO ABAIXO",
          titleFileList: "Lista de ficheiros"
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
          deleted: "O atendimento que estava a gerir foi eliminado."
        },
        notification: {
          message: "Mensagem de",
          nomessages: "Sem novas mensagens"
        },
        tabs: {
          open: { title: "Abertos" },
          closed: { title: "Resolvidos" },
          groups: { title: "Grupos" },
          search: { title: "Busca" }
        },
        search: {
          filterByUsers: "Filtrar por utilizadores",
          filterByTags: "Filtrar por etiquetas",
          placeholder: "Buscar atendimento e mensagens"
        },
        buttons: {
          showAll: "Todos"
        }
      },
      transferTicketModal: {
        hintQueue:
          'Sem atendente, o atendimento volta para "A aguardar" da fila escolhida.',
        hintUser: "Vai diretamente para {{name}}, já em atendimento.",
        userLabel: "Atendente (opcional)",
        title: "Transferir atendimento",
        fieldLabel: "Digite para buscar utilizadores",
        fieldQueueLabel: "Fila de destino",
        fieldQueuePlaceholder: "Selecione uma fila",
        noOptions: "Nenhum utilizador encontrado com esse nome",
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
        assignedHeader: "Em atendimento",
        noTicketsTitle: "Nada aqui!",
        noTicketsMessage:
          "Nenhum atendimento encontrado com este estado ou termo pesquisado",
        buttons: {
          accept: "Aceitar"
        }
      },
      newTicketModal: {
        title: "Criar Ticket",
        fieldLabel: "Digite para pesquisar o contacto",
        add: "Adicionar",
        buttons: {
          ok: "Salvar",
          cancel: "Cancelar"
        }
      },
      mainDrawer: {
        tree: {
          devPipeline: "Pipeline de IA",
          conversations: "Conversas",
          all: "Todas as conversas",
          pending: "Por atender",
          closed: "Resolvidas",
          groups: "Grupos",
          channels: "Canais",
          queues: "Filas",
          noChannels: "Nenhuma caixa de entrada",
          noQueues: "Nenhuma fila",
          settings: "Definições",
          general: "Geral",
          compose: "Nova conversa",
          offline: "Desligada",
          inboxFilter: "Caixa"
        },
        sections: {
          service: "Atendimento",
          audience: "Contactos",
          management: "Gestão",
          system: "Sistema"
        },
        listItems: {
          devPipeline: "Pipeline de IA",
          super: "Super admin",
          dashboard: "Dashboard",
          connections: "Caixa de entrada",
          tickets: "Atendimentos",
          quickMessages: "Respostas Rápidas",
          contacts: "Contactos",
          queues: "Filas & Chatbot",
          tags: "Tags",
          administration: "Administração",
          service: "Serviço",
          users: "Utilizadores",
          settings: "Configurações",
          helps: "Ajuda",
          messagesAPI: "API",
          schedules: "Agendamentos",
          campaigns: "Campanhas",
          annoucements: "Informativos",
          chats: "Chat Interno",
          chatsShort: "Chat",
          ticketsShort: "Conversas",
          search: "Pesquisar",
          online: "Online",
          noResults: "Nada encontrado",
          financeiro: "Financeiro",
          logout: "Sair",
          management: "Gestão",
          kanban: "Kanban",
          tasks: "Tarefas",
          more: "Mais",
          menu: "Menu"
        },
        appBar: {
          i18n: {
            language: "Português 🇵🇹",
            language_short: "pt_PT"
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
          token: "Token registado"
        },
        mediaMessage: {
          number: "Número",
          body: "Nome do ficheiro",
          media: "Ficheiro",
          token: "Token registado"
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
          "Arraste os contactos entre as colunas para acompanhar cada etapa do atendimento.",
        inbox: "Em aberto",
        newLane: "Nova coluna",
        editLane: "Editar coluna",
        deleteLane: "Eliminar coluna",
        deleteLaneTitle: "Eliminar a coluna",
        deleteLaneMessage:
          "Os atendimentos desta coluna voltam para Em aberto. Nenhum atendimento é apagado.",
        moveTo: "Mover para",
        moveLeft: "Mover para a esquerda",
        moveRight: "Mover para a direita",
        openConversation: "Abrir conversa",
        emptyLane: "Arraste atendimentos para aqui",
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
          deleteTitle: "Tem a certeza que quer excluir esta Lane?",
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
        title: "Listas de Contactos",
        table: {
          name: "Nome",
          contacts: "Contactos",
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
        title: "Contactos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo",
          lists: "Listas",
          import: "Importar"
        },
        dialog: {
          name: "Nome",
          number: "Número",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        table: {
          name: "Nome",
          number: "Número",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Ações"
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
          importMessage: "Deseja importar os contactos desta planilha?",
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
          contactLists: "Listas de Contactos"
        },
        table: {
          name: "Nome",
          whatsapp: "Conexão",
          contactList: "Lista de Contactos",
          status: "Estado",
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
            status: "Estado",
            scheduledAt: "Agendamento",
            confirmation: "Confirmação",
            contactList: "Lista de Contactos"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar Envios",
            restart: "Reiniciar Envios",
            close: "Fechar",
            attach: "Anexar Ficheiro"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
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
          title: "Título",
          text: "Texto",
          mediaName: "Ficheiro",
          status: "Estado",
          actions: "Ações"
        },
        dialog: {
          edit: "Edição de Informativo",
          add: "Novo Informativo",
          update: "Editar Informativo",
          readonly: "Apenas Visualização",
          form: {
            priority: "Prioridade",
            title: "Título",
            text: "Texto",
            mediaPath: "Ficheiro",
            status: "Estado"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Fechar",
            attach: "Anexar Ficheiro"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
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
          deleteTitle: "Eliminar",
          deleteMessage:
            "Tem a certeza? Esta ação não pode ser revertida! Os atendimentos desta fila continuarão a existir, mas não terão mais nenhuma fila atribuída."
        }
      },
      queueSelect: {
        inputLabel: "Filas"
      },
      users: {
        title: "Utilizadores",
        table: {
          name: "Nome",
          email: "Email",
          profile: "Perfil",
          actions: "Ações"
        },
        buttons: {
          add: "Adicionar utilizador"
        },
        toasts: {
          deleted: "Utilizador excluído com sucesso."
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "Todos os dados do utilizador serão perdidos. Os atendimentos abertos deste utilizador serão movidos para a fila."
        }
      },
      helps: {
        title: "Central de Ajuda"
      },
      notificationSound: {
        title: "Som das notificações",
        description:
          "Toca um aviso sonoro quando chega uma mensagem nova. Vale só para este dispositivo.",
        on: "ligado",
        off: "desligado"
      },
      push: {
        title: "Notificações neste dispositivo",
        description:
          "Receba as mensagens novas com o nome e a foto do contacto, mesmo com a app fechada.",
        activeDescription:
          "Recebe as mensagens novas com o nome e a foto do contacto, mesmo com a app fechada.",
        enable: "Ativar",
        enabled: "Ativadas",
        enableOnPhone: "Ativar notificações",
        enabledToast: "Notificações ativadas neste dispositivo",
        blocked:
          "As notificações estão bloqueadas. Permita-as nas definições do navegador ou do telemóvel.",
        failed:
          "Não foi possível ativar as notificações agora. Tente novamente.",
        unsupported: "Este navegador não recebe notificações push.",
        iosHint:
          "No iPhone, adicione o sistema ao ecrã principal (Partilhar > Adicionar ao ecrã principal) e abra-o por lá para ativar."
      },
      quickReplies: {
        title: "Respostas rápidas",
        search: "Procurar por atalho ou texto",
        empty:
          "Ainda não há respostas rápidas. Crie a primeira para usar nas conversas.",
        emptySearch: "Nenhuma resposta encontrada.",
        use: "Usar esta resposta",
        edit: "Editar",
        delete: "Eliminar",
        deleteTitle: "Eliminar resposta rápida?",
        deleteMessage:
          "Deixa de aparecer para a equipa. Esta ação não pode ser desfeita.",
        add: "Nova resposta",
        close: "Fechar",
        added: "Resposta rápida criada",
        updated: "Resposta rápida atualizada",
        deleted: "Resposta rápida eliminada"
      },
      ticketActions: {
        spy: "Espreitar conversa",
        close: "Encerrar conversa",
        noQueue: "Sem fila"
      },
      expressions: {
        searchEmoji: "Procurar emoji",
        recent: "Recentes",
        frequent: "Mais usados",
        emojiResults: "Resultados",
        noEmoji: "Nenhum emoji encontrado",
        emojiCategories: {
          people: "Caras e pessoas",
          nature: "Animais e natureza",
          foods: "Comidas e bebidas",
          activity: "Atividades",
          places: "Viagens e lugares",
          objects: "Objetos",
          symbols: "Símbolos",
          flags: "Bandeiras"
        },
        title: "Emoji, autocolantes e GIFs",
        emoji: "Emoji",
        stickers: "Autocolantes",
        gifs: "GIFs",
        searchStickers: "Procurar autocolantes",
        searchGifs: "Procurar GIFs",
        noStickers:
          "Os autocolantes que chegarem nas conversas aparecem aqui para voltar a enviar.",
        noGifs: "Nenhum GIF encontrado.",
        gifsNotConfigured:
          "Os GIFs ainda não estão configurados: o administrador do sistema adiciona a chave do KLIPY em Definições > Opções > Integrações.",
        sendSticker: "Enviar autocolante",
        sendGif: "Enviar GIF"
      },
      about: {
        headline: "Feita para atender melhor, todos os dias",
        product:
          "O vuup.me é uma plataforma de atendimento pelo WhatsApp que reúne a equipa num só lugar: conversas, filas, chatbot, Kanban e chat interno.",
        founder:
          "Eu sou o David Fernandes, tenho 22 anos e empreendo na área da tecnologia.",
        improving:
          "Estou sempre a melhorar o vuup.me: cada atualização traz ajustes e novidades para tornar o dia a dia de quem atende mais simples.",
        founderRole: "Fundador do vuup.me",
        license: "Software livre sob a licença AGPL-3.0.",
        sourceCode: "Código-fonte",
        aboutthe: "Sobre a",
        copyright: "© 2024 - Funcionando com vuup.me",
        buttonclose: "Fechar",
        title: "Sobre o vuup.me",
        abouttitle: "Origem e melhorias",
        aboutdetail:
          "O vuup.me é derivado indireto do projeto Whaticket com melhorias compartilhadas pelos desenvolvedores do sistema EquipeChat através do canal VemFazer no YouTube, posteriormente melhoradas por Claudemir Todo Bom",
        aboutauthorsite: "Site do autor",
        aboutwhaticketsite: "Site do Whaticket Community no Github",
        aboutvemfazersite: "Site do canal Vem Fazer no Github",
        licenseheading: "Licença em Código Aberto",
        licensedetail:
          "O vuup.me está licenciado sob a GNU Affero General Public License versão 3, isso significa que qualquer utilizador que tiver acesso a esta aplicação tem o direito de obter acesso ao código fonte. Mais informações nos links abaixo:",
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
          next: "Mês seguinte",
          count: "{{count}} agendamento",
          count_plural: "{{count}} agendamentos"
        },
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "Tem a certeza que quer excluir este Agendamento?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          contact: "Contacto",
          body: "Mensagem",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          status: "Estado",
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
          deleteTitle: "Tem a certeza que quer excluir esta Tag?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Tickets",
          contacts: "Contactos",
          actions: "Ações",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nova Tag"
        },
        toasts: {
          deleted: "Tag excluída com sucesso."
        }
      },
      whitelabel: {
        primaryColorLight: "Cor primária clara",
        primaryColorDark: "Cor primária escura",
        lightLogo: "Logo claro da aplicação",
        darkLogo: "Logo escuro da aplicação",
        favicon: "Favicon da aplicação",
        appname: "Nome da aplicação",
        logoHint: "Prefira SVG e proporção de 28:10",
        faviconHint: "Prefira uma imagem SVG quadrada ou PNG 512x512",
        loginLinks: "Links do login",
        loginLinksHint:
          "Adicione pares de título e URL para mostrar abaixo da caixa de login em desktop e mobile.",
        linkTitle: "Título do link",
        linkUrl: "URL do link",
        removeLink: "Remover link",
        sidePanelImage: "Imagem lateral do login",
        sidePanelImageHint:
          "Mostrada no lado esquerdo do formulário de login em ecrãs desktop.",
        backgroundContent: "Conteúdo de fundo do login",
        backgroundContentHint:
          "Aceita imagens, ficheiros SVG e vídeos MP4 para o fundo do ecrã de login.",
        noFileSelected: "Ainda não foi selecionado nenhum ficheiro.",
        buildExtension: "Construir extensão WA Session Capture",
        buildingExtension: "A construir extensão…",
        downloadExtension: "Transferir extensão",
        extensionHint:
          "Constrói uma extensão Chrome personalizada. O ZIP transferido já contém os ficheiros da extensão: extraia e carregue a pasta extraída como extensão descompactada.",
        extensionBuildStarted:
          "Construção da extensão iniciada. Será notificado quando estiver pronta.",
        extensionBuildFailed:
          "Não foi possível iniciar a construção da extensão.",
        extensionBuilt: "Extensão construída com sucesso.",
        extensionBuildUnknownError: "Erro desconhecido na construção."
      },
      devPipeline: {
        difficulty: {
          easy: "Fácil",
          medium: "Média",
          hard: "Difícil"
        },
        devices: {
          desktop: "Computador",
          mobile: "Telemóvel"
        },
        testActions: {
          goto: "Abrir",
          click: "Clicar em",
          fill: "Preencher",
          press: "Tecla",
          wait: "Esperar",
          scroll: "Deslizar",
          screenshot: "Foto"
        },
        agentBios: {
          triage:
            "Curiosa, vasculha o código até encontrar onde o problema está. Escreve pouco e vai direta ao assunto: reescreve o pedido, aponta os ficheiros e diz se é fácil ou difícil.",
          priority:
            "Decide o que é mesmo urgente, sem falsos alarmes. Trabalha com a Xereta, na mesma chamada.",
          developer:
            "Programador pragmático: faz a menor alteração que resolve e não deixa pontas soltas. Nas demandas difíceis, entra com o modelo mais forte.",
          reviewer:
            "Revisora exigente e justa: olha cada linha à lupa, mas só trava o que é mesmo um problema.",
          tester:
            "O fotógrafo da equipa: depois do merge, abre o sistema em produção, grava vídeo e tira fotos no computador e no telemóvel para provar que funcionou.",
          learner:
            "O professor da equipa: transforma cada tropeção numa lição curta que os outros agentes não esquecem."
        },
        team: {
          intro:
            "Cada agente usa o modelo que a sua tarefa pede, pelo OpenRouter. O modelo caro só entra quando a triagem diz que a demanda é média ou difícil.",
          price: "{{input}} entrada · {{output}} saída, por milhão de tokens",
          sameCall:
            "Decide com a Xereta, na mesma chamada: não custa nada a mais.",
          single:
            "Todos os agentes usam {{provider}} · {{model}}. Com o OpenRouter, cada um usa o modelo da sua tarefa, e fica mais barato.",
          routingTitle: "Quem escreve e quem revê, pela dificuldade",
          difficulty: "Dificuldade",
          routingHint:
            "Risco alto (dinheiro, dados, login ou envio de mensagens) conta como difícil. Se um modelo falhar, o OpenRouter usa o de reserva automaticamente."
        },
        slots: {
          triage: "Sempre",
          developer: "Demanda fácil",
          developerHard: "Média ou difícil",
          reviewer: "Fácil ou média",
          reviewerHard: "Difícil ou arriscada",
          tester: "Sempre",
          learner: "Sempre"
        },
        title: "Pipeline de IA",
        subtitle:
          "Melhorias e correções feitas por agentes de IA: triagem, código, code review, PR e testes. Aprova antes do código e revê o PR antes do merge.",
        newTask: "Nova demanda",
        search: "Pesquisar por título, empresa ou #número",
        showCancelled: "Mostrar canceladas",
        summary: "{{waiting}} à sua espera · {{running}} em execução",
        empty: "Nada por aqui",
        showAll: "Ver todas ({{count}})",
        tokens: "{{count}} tokens",
        tokensDetail:
          "{{input}} de entrada · {{output}} de saída · {{cached}} da cache",
        round: "Ronda {{count}}",
        effort: "Esforço {{value}}",
        stages: {
          tests: "Testes",
          intake: "Início",
          prioritization: "Priorização",
          development: "Desenvolvimento",
          review: "Code review",
          pr: "PR",
          done: "Concluído",
          cancelled: "Canceladas"
        },
        stageHints: {
          tests: "Depois do merge, o Clique testa no ecrã com fotos e vídeo",
          intake:
            "O agente percebe o pedido, consulta o código e reescreve a tarefa",
          prioritization: "Confere a prioridade e aprova antes do código",
          development: "O agente programador escreve o código",
          review: "O agente revisor confere o diff e pede ajustes",
          pr: "Branch e PR prontos para rever",
          done: "Testada no ecrã ou concluída por si",
          cancelled: "Demandas que não vão avançar"
        },
        line: {
          testsWaiting: "À espera da nova versão em produção",
          testsFailed: "O teste de ecrã reprovou",
          testsUnclear: "O teste não conseguiu confirmar",
          queued: "Na fila",
          running: {
            tests: "Clique a testar no ecrã",
            intake: "Xereta a analisar o pedido",
            prioritization: "A preparar o desenvolvimento",
            development: "Zé Commit a escrever o código",
            review: "Dona Lupa a conferir o diff",
            pr: "A abrir o PR"
          },
          notAnalyzed: "À espera de análise",
          questions: "O agente tem perguntas para si",
          approve: "Aprove para desenvolver",
          stuck: "O revisor pede uma decisão sua",
          pr: "PR #{{number}} aberto",
          patch: "Patch pronto para transferir",
          done: "Concluída",
          cancelled: "Cancelada"
        },
        hints: {
          testsWaiting:
            "O PR foi aceite. Quando a nova versão subir (atualização da stack), o Clique testa sozinho. Se já estiver em produção, execute agora.",
          testsFailed:
            "Veja as fotos na conversa. Para corrigir, escreva abaixo e clique em “Enviar aos agentes”: o que o Clique viu vai junto.",
          testsUnclear:
            "O Clique não conseguiu ver o resultado (o motivo está na conversa). Execute de novo ou conclua.",
          running: "Os agentes estão a trabalhar; a conversa atualiza sozinha.",
          error:
            "Veja o erro na conversa, corrija o que faltar e tente novamente.",
          notAnalyzed: "Pedido de cliente: a análise só começa quando mandar.",
          questions:
            "Responda na caixa abaixo e clique em “Enviar aos agentes”.",
          approve:
            "Confira a especificação, ajuste a prioridade se for preciso e aprove.",
          stuck:
            "Publique assim, peça outra ronda comentando abaixo ou cancele.",
          pr: "Reveja e teste antes do merge. Para pedir ajustes, comente abaixo.",
          patch:
            "Sem GitHub com token: aplique o patch com git apply. Para pedir ajustes, comente abaixo."
        },
        priority: {
          urgent: "Urgente",
          high: "Alta",
          normal: "Normal",
          low: "Baixa"
        },
        kind: {
          bug: "Bug",
          feature: "Funcionalidade",
          improvement: "Melhoria",
          chore: "Manutenção"
        },
        risk: {
          low: "Risco baixo",
          medium: "Risco médio",
          high: "Risco alto"
        },
        severity: {
          blocker: "Bloqueia",
          major: "Importante",
          minor: "Detalhe"
        },
        source: {
          admin: "Você",
          help: "Cliente"
        },
        agents: {
          tester: "Clique",
          triage: "Xereta",
          priority: "Sirene",
          developer: "Zé Commit",
          reviewer: "Dona Lupa",
          learner: "Sabichão",
          system: "Engrenagem",
          human: "Você"
        },
        tabs: {
          team: "Equipa",
          board: "Quadro",
          skills: "Skills",
          conversation: "Conversa",
          spec: "Especificação",
          code: "Código"
        },
        events: {
          test: "pediu para executar os testes de ecrã",
          testPlan: "planeou o teste de ecrã",
          testNotNeeded: "viu que esta alteração não aparece no ecrã",
          testRun: "gravou o teste: {{count}} foto(s)",
          testSkip: "saltou o teste de ecrã",
          testChecks: "O que as fotos têm de mostrar",
          testSteps: "Guião",
          testFailedSteps: "Passos que falharam",
          testPageErrors: "Erros de JavaScript no ecrã",
          testSafe:
            "Navegador só de leitura: {{count}} tentativa(s) de gravar bloqueada(s); nada no sistema foi alterado.",
          testOk: "OK",
          testNotOk: "Não",
          testResult: {
            pass: "aprovou no ecrã",
            fail: "reprovou no ecrã",
            unclear: "não conseguiu confirmar"
          },
          testSkipReason: {
            no_browser:
              "O navegador de testes não está configurado (PLAYWRIGHT_WS_ENDPOINT)."
          },
          searched: "Buscou no código",
          learned: "aprendeu {{count}} skill(s)",
          learnedNothing:
            "estudou a demanda e não encontrou nada novo para aprender",
          request: "abriu o pedido",
          readTriage: "consultou o código",
          read: "leu",
          spec: "reescreveu a tarefa",
          question: "precisa de respostas",
          questionHint: "Responda abaixo e clique em “Enviar aos agentes”.",
          priority: "sugeriu prioridade {{priority}}",
          edits: "alterou {{count}} ficheiro(s)",
          editErrors: "Edições que não serviram",
          checks: "Erros de sintaxe",
          notes: "Notas",
          approved: "aprovou o código",
          changes: "pediu ajustes",
          stage: "Passou para {{stage}}",
          error: "a etapa falhou",
          pr: "abriu o PR #{{number}} (rascunho)",
          patch: "deixou o patch pronto",
          patchReason: {
            local:
              "Modo de teste: o código veio desta máquina, por isso nenhum PR é aberto.",
            no_token:
              "Sem token do GitHub: transfira o patch e aplique com git apply."
          },
          stuckTitle: "precisa de si",
          stuck:
            "O revisor ainda pede ajustes depois de {{count}} ronda(s). Decida: publicar assim, pedir outra ronda ou cancelar.",
          merged: "PR #{{number}} integrado",
          approve: "aprovou para desenvolvimento ({{priority}})",
          publish: "mandou publicar mesmo assim",
          done: "marcou como concluída",
          cancel: "cancelou a demanda",
          comment: "comentou",
          rerun: "enviou aos agentes"
        },
        actions: {
          testNow: "Executar testes agora",
          testAgain: "Executar de novo",
          doneAnyway: "Concluir mesmo assim",
          doneWithoutTests: "Concluir sem testar",
          learn: "Aprender com esta demanda",
          approve: "Aprovar e desenvolver",
          analyze: "Analisar agora",
          retry: "Tentar novamente",
          publish: "Publicar mesmo assim",
          done: "Concluir",
          cancel: "Cancelar demanda",
          delete: "Eliminar",
          openPr: "Abrir PR",
          download: "Transferir patch",
          comment: "Só comentar",
          rerun: "Enviar aos agentes",
          save: "Guardar",
          edit: "Editar",
          close: "Fechar",
          more: "Mais opções"
        },
        composer: {
          placeholder: "Escreva para os agentes ou deixe uma nota…",
          hint: "“Enviar aos agentes” manda isto {{target}}.",
          toTriage: "para a triagem refazer a análise",
          toDeveloper: "para o programador ajustar o código",
          busy: "Os agentes estão a trabalhar: pode comentar, e o envio fica para quando terminarem."
        },
        spec: {
          skills: "Skills usadas",
          task: "Tarefa",
          title: "Título",
          spec: "Especificação",
          acceptance: "Critérios de aceitação",
          acceptanceHint: "Um critério por linha",
          files: "Ficheiros envolvidos",
          priorityReason: "Porquê esta prioridade",
          original: "Pedido original",
          empty: "A triagem ainda não correu",
          emptyHint: "Quando correr, a tarefa reescrita aparece aqui."
        },
        code: {
          empty: "Ainda não há código",
          emptyHint: "O diff aparece aqui quando o programador terminar.",
          ops: {
            create: "novo",
            edit: "alterado",
            delete: "apagado"
          }
        },
        new: {
          title: "Nova demanda",
          subtitle:
            "O agente de triagem consulta o código e reescreve a tarefa antes de qualquer linha de código.",
          name: "Título",
          description: "O que é preciso fazer",
          descriptionHint:
            "Descreva como explicaria a alguém da equipa: onde acontece e o que devia acontecer.",
          priority: "Prioridade inicial",
          create: "Criar e analisar"
        },
        setup: {
          perAgent: "OpenRouter · um modelo por agente",
          seeTeam: "ver a equipa",
          open: "Abrir definições",
          noKey: "Falta a chave da IA.",
          noRepo: "Falta o repositório do GitHub.",
          local:
            "Modo de teste: a ler o código desta máquina (vira patch, sem PR)",
          readOnly: "{{repo}} sem token: lê o código e o resultado vira patch",
          github: "PRs em {{repo}}",
          provider: {
            openrouter: "OpenRouter",
            anthropic: "Claude",
            openai: "OpenAI"
          }
        },
        confirm: {
          cancel: "Cancelar esta demanda?",
          cancelText:
            "Os agentes param antes da próxima chamada. Se veio de um cliente, ele é avisado na Ajuda.",
          delete: "Eliminar esta demanda?",
          deleteText:
            "A conversa dos agentes e o código gerado são apagados de vez."
        },
        toasts: {
          testing: "O Clique está a testar no ecrã",
          learning: "O Sabichão está a estudar esta demanda",
          created: "Demanda #{{id}} criada: a triagem começou",
          approved: "Aprovada: o desenvolvimento começou",
          sent: "Enviado aos agentes"
        },
        agentRoles: {
          tester: "testes",
          triage: "triagem",
          priority: "prioridade",
          developer: "código",
          reviewer: "revisão",
          learner: "aprendizagem"
        },
        designChip: "Interface",
        images: {
          title: "Imagens",
          drop: "Arraste imagens, cole uma captura (Ctrl+V) ou toque para escolher. A IA consegue ver.",
          attach: "Anexar imagem",
          remove: "Remover imagem",
          tooBig: "{{name}} tem mais de 8 MB",
          limit: "No máximo {{count}} imagens"
        },
        stats: {
          title: "Resumo",
          done: "Concluídas",
          doneHint: "de {{total}} demandas",
          open: "Por fazer",
          openHint: "{{count}} à espera de aprovação",
          spent: "Gasto total",
          spentHint: "{{tokens}} tokens de IA",
          average: "Média por concluída",
          averageHint: "custo de IA por demanda pronta",
          weeksTitle: "Últimas 8 semanas",
          weeksHint: "Demandas criadas e concluídas por semana, e o gasto",
          created: "Criadas",
          doneLegend: "Concluídas",
          spentLegend: "Gasto (R$)",
          weekOf: "Semana de {{date}}",
          createdCount: "{{count}} criada(s)",
          doneCount: "{{count}} concluída(s)",
          openersTitle: "Quem abriu",
          openersHint: "{{team}} pela equipa · {{help}} por clientes",
          team: "Equipa (super)",
          teamTitle: "A equipa de agentes"
        },
        skills: {
          intro:
            "O que os agentes sabem do projeto. Cada tarefa usa só as skills que a triagem escolher. Ensine com as suas palavras ou deixe o Sabichão aprender com as correções.",
          teach: "Ensinar",
          new: "Nova skill",
          teachTitle: "Ensinar os agentes",
          teachHint:
            "Escreva à sua maneira: uma regra, uma preferência de design, como funciona uma parte do sistema. A IA organiza tudo numa skill (ou melhora uma que já existe).",
          teachPlaceholder:
            "Ex.: Nos ecrãs de definições, o botão de guardar fica sempre no rodapé, alinhado à direita. No telemóvel ocupa a largura toda.",
          teachSend: "Organizar em skill",
          teaching: "A organizar…",
          editTitle: "Editar skill",
          newTitle: "Nova skill",
          fields: {
            name: "Nome",
            description: "Quando usar",
            descriptionHint:
              "Uma frase: é por ela que a triagem decide se a skill serve para a tarefa.",
            content: "Conteúdo",
            contentHint:
              "Tópicos curtos e diretos. Tudo isto vai para o agente quando a skill é usada."
          },
          filters: {
            active: "Em uso",
            proposed: "Propostas",
            archived: "Arquivadas"
          },
          search: "Buscar skill",
          empty: {
            active: "Nenhuma skill em uso",
            proposed: "Nenhuma proposta à sua espera",
            archived: "Nada arquivado"
          },
          emptyHint:
            "Ensine algo novo ou deixe o Sabichão aprender com as próximas demandas.",
          status: {
            active: "Em uso",
            proposed: "Proposta",
            archived: "Arquivada"
          },
          source: {
            seed: "Padrão",
            human: "Você",
            agentFrom: "{{name}} · #{{id}}"
          },
          replaces: "Nova versão de “{{name}}”",
          newProposal: "Skill nova",
          uses: "usada {{count}} vez(es)",
          lastUsed: "última em {{date}}",
          more: "Ver tudo",
          less: "Ver menos",
          showOld: "Ver versão atual",
          showNew: "Ver proposta",
          approve: "Aprovar",
          discard: "Descartar",
          archive: "Arquivar",
          restore: "Reativar",
          confirmDiscard: "Descartar esta proposta?",
          confirmDelete: "Eliminar esta skill?",
          toasts: {
            approve: "Skill aprovada: os agentes já a usam",
            archive: "Skill arquivada",
            restore: "Skill de volta ao uso",
            delete: "Skill eliminada",
            discard: "Proposta descartada",
            saved: "Skill guardada",
            taught: "Aprendido: “{{name}}”"
          }
        },
        errors: {
          ERR_DEV_AI_CREDITS:
            "O crédito do OpenRouter acabou (ou o limite da chave): recarregue em openrouter.ai",
          ERR_DEV_AI_TIMEOUT:
            "A IA demorou demasiado a responder: tente de novo",
          ERR_DEV_TEST_NO_BROWSER: "O navegador de testes não está configurado",
          ERR_DEV_TEST_NO_URL:
            "Falta o endereço do sistema (FRONTEND_URL) para o teste",
          ERR_DEV_TEST_NO_USER: "Nenhum super admin ativo para o teste entrar",
          ERR_DEV_TEST_BROWSER: "O navegador de testes não respondeu",
          ERR_DEV_AI_NOT_CONFIGURED: "Falta a chave da IA nas definições",
          ERR_DEV_AI_AUTH: "A chave da IA foi recusada",
          ERR_DEV_AI_MODEL:
            "O modelo escolhido não existe ou não está disponível para esta chave",
          ERR_DEV_AI_RATE_LIMIT:
            "Limite de utilização da IA atingido: tente daqui a pouco",
          ERR_DEV_AI_OFFLINE: "Sem ligação à IA",
          ERR_DEV_AI_REFUSAL: "A IA recusou o pedido",
          ERR_DEV_AI_TRUNCATED:
            "A resposta da IA ficou grande demais e foi cortada",
          ERR_DEV_AI_FORMAT: "A IA respondeu fora do formato combinado",
          ERR_DEV_AI_FAILED: "A IA devolveu um erro",
          ERR_DEV_NO_REPO: "Nenhum repositório configurado",
          ERR_DEV_GITHUB_AUTH: "O token do GitHub foi recusado",
          ERR_DEV_GITHUB_PERMISSION:
            "O token do GitHub lê o repositório, mas não pode escrever nele. Crie o token com a organização dona do repositório como Resource owner e dê Contents e Pull requests em leitura e escrita",
          ERR_DEV_GITHUB_FORBIDDEN:
            "O token do GitHub não tem permissão para isto",
          ERR_DEV_GITHUB_NOT_FOUND:
            "Repositório ou branch não encontrado no GitHub",
          ERR_DEV_GITHUB_RATE_LIMIT:
            "Limite de utilização do GitHub atingido: configure um token ou espere uma hora",
          ERR_DEV_GITHUB_NO_TOKEN: "Falta o token do GitHub para abrir o PR",
          ERR_DEV_GITHUB_FAILED: "O GitHub devolveu um erro",
          ERR_DEV_NO_CHANGES: "O programador não alterou nenhum ficheiro",
          ERR_DEV_TOO_BIG:
            "Alteração grande demais para a revisão automática: divida a demanda",
          ERR_DEV_TOKEN_LIMIT: "A demanda chegou ao limite de tokens",
          ERR_DEV_FAILED: "Erro inesperado"
        }
      },
      settings: {
        options: {
          nav: "Secções das opções",
          sections: {
            devPipeline: {
              title: "Pipeline de IA",
              description:
                "Agentes que analisam pedidos de melhoria, escrevem o código, revêem, abrem PR no GitHub e testam no ecrã depois do merge. Vale para a instalação inteira."
            },
            service: {
              title: "Atendimento",
              description:
                "Mensagens automáticas e o que acontece quando uma conversa é aceite, transferida, encerrada ou reaberta."
            },
            automation: {
              title: "Chatbot e automações",
              description:
                "O menu automático que recebe o cliente e o que o sistema faz sozinho com as conversas paradas."
            },
            hours: {
              title: "Horário de funcionamento",
              description:
                "Em que horário a empresa atende e o que fazer com as mensagens que chegam fora dele."
            },
            chat: {
              title: "Conversas",
              description:
                "O que a equipa vê e usa no ecrã de conversa: histórico, respostas rápidas, chamadas e grupos."
            },
            ai: {
              title: "Inteligência artificial",
              description:
                "Fornecedores e chaves da transcrição de áudios e do assistente de IA das filas."
            },
            integrations: {
              title: "Integrações",
              description:
                "Chaves para outros sistemas e serviços trabalharem em conjunto com o vuup.me."
            },
            files: {
              title: "Ficheiros",
              description:
                "Tamanho máximo dos ficheiros enviados e recebidos pelas ligações. Vale para todas as empresas."
            },
            system: {
              title: "Sistema",
              description:
                "Opções da instalação inteira. Valem para todas as empresas."
            }
          },
          groups: {
            devModels: "Modelos por agente (OpenRouter)",
            devModelsHint:
              "Em branco, cada agente usa o padrão (aparece no campo). Para trocar, use o nome do modelo como está em openrouter.ai, ex.: openai/gpt-6-luna.",
            devAi: "Inteligência artificial",
            devAiHint:
              "Que IA os agentes usam. Com o OpenRouter, cada agente usa o modelo da sua tarefa (o caro só nas demandas difíceis); com Claude ou OpenAI, um único modelo faz tudo. O contexto do projeto fica em cache entre as chamadas.",
            devRepo: "Repositório (GitHub)",
            devRepoHint:
              "De onde o código é lido e onde o PR é aberto. Sem token, o código é lido (se o repositório for público) e o resultado vira um patch para transferir.",
            devRules: "Regras do pipeline",
            autoMessages: "Mensagens automáticas",
            closing: "Encerramento",
            rating: "Inquérito de satisfação",
            tags: "Tags",
            chatbot: "Chatbot",
            idle: "Conversas paradas",
            idleHint:
              "Escolha ao fim de quanto tempo o sistema age sozinho. Deixe 0 para não fazer nada.",
            chatScreen: "Ecrã de conversa",
            calls: "Chamadas",
            groups: "Grupos do WhatsApp",
            transcription: "Transcrição de áudios",
            agent: "Assistente de IA das filas",
            agentHint:
              "Usado pelas filas com o Assistente de IA ativo (Filas & Chatbot › editar fila), pela receção inteligente e pelo assistente dentro da conversa. É separado da chave de transcrição.",
            api: "API",
            media: "GIFs e autocolantes",
            limits: "Limites de tamanho",
            access: "Idioma, registo e cobrança",
            server: "Servidor"
          },
          units: {
            tokens: "tokens",
            minutes: "min",
            days: "dias",
            megabytes: "MB"
          },
          timeout: {
            after: "Ao fim de",
            then: "O sistema vai",
            close: "Encerrar a conversa",
            transferTo: "Enviar para a fila {{queue}}"
          },
          variables: {
            title: "Pode usar:",
            firstname: "primeiro nome do cliente",
            name: "nome completo",
            greeting: "bom dia, boa tarde ou boa noite",
            user: "nome do agente",
            queue: "nome da fila",
            protocol: "número de protocolo"
          },
          notes: {
            needsRating: "Ative a avaliação para usar.",
            needsSchedule: "Ative o controlo de horário para usar.",
            groupsIgnored:
              "Disponível quando as mensagens de grupos não são ignoradas.",
            scheduleCompany:
              "Os horários ficam no separador Horários, aqui nas Definições.",
            scheduleQueue:
              "Os horários de cada fila ficam em Filas & Chatbot, ao editar a fila."
          },
          apiToken: {
            generate: "Gerar token",
            copy: "Copiar",
            remove: "Apagar",
            empty: "Nenhum token gerado"
          },
          fields: {
            _devOpenRouterKey: {
              title: "Chave do OpenRouter",
              description:
                "openrouter.ai › Keys. Em branco, usa a variável OPENROUTER_API_KEY da stack."
            },
            _devModelTriage: {
              title: "Xereta (triagem)",
              description:
                "Lê o pedido, encontra os ficheiros e escreve a tarefa."
            },
            _devModelDeveloper: {
              title: "Zé Commit: demanda fácil",
              description: "Escreve o código quando a triagem diz que é fácil."
            },
            _devModelDeveloperHard: {
              title: "Zé Commit: média ou difícil",
              description:
                "Escreve o código das demandas médias, difíceis ou arriscadas."
            },
            _devModelReviewer: {
              title: "Dona Lupa: fácil ou média",
              description: "Revê o código das demandas fáceis e médias."
            },
            _devModelReviewerHard: {
              title: "Dona Lupa: difícil ou arriscada",
              description:
                "Revê as difíceis. Uma família diferente da do programador apanha o que ele não viu."
            },
            _devModelTester: {
              title: "Clique (testes)",
              description:
                "Planeia o teste de ecrã e confere as fotos. Precisa de ver imagens."
            },
            _devModelLearner: {
              title: "Sabichão (skills)",
              description: "Transforma correções e ensinamentos em skills."
            },
            _devAutoLearn: {
              title: "Aprender sozinho",
              description:
                "O Sabichão estuda as correções de cada demanda (os seus comentários, o que o revisor barrou, edições que falharam) e cria ou melhora skills. Ligado, entram logo em uso; desligado, esperam a sua aprovação no separador Skills. O que vem de pedidos de clientes espera sempre."
            },
            _devUsdBrl: {
              title: "Cotação do dólar (R$)",
              description:
                "Para mostrar o custo em reais. Em branco, usa a cotação do dia, atualizada a cada 12 horas."
            },
            _devAiProvider: {
              title: "Fornecedor",
              description:
                "OpenRouter (recomendado: um modelo por agente, o mais barato), Claude (Anthropic) ou GPT (OpenAI).",
              options: {
                openrouter: "OpenRouter (recomendado)",
                anthropic: "Claude (Anthropic)",
                openai: "GPT (OpenAI)"
              }
            },
            _devAnthropicKey: {
              title: "Chave da Anthropic",
              description: "console.anthropic.com › API Keys."
            },
            _devAnthropicModel: {
              title: "Modelo",
              description:
                "O Opus é o equilíbrio recomendado. Sonnet e Haiku custam menos por token; o Fable é o mais capaz e o mais caro.",
              options: {
                "claude-opus-5": "Claude Opus 5 (recomendado)",
                "claude-sonnet-5": "Claude Sonnet 5 (mais barato)",
                "claude-haiku-4-5": "Claude Haiku 4.5 (o mais barato)",
                "claude-fable-5-1": "Claude Fable 5.1 (o mais capaz)"
              }
            },
            _devOpenAiKey: {
              title: "Chave da OpenAI",
              description:
                "platform.openai.com › API keys. Em branco, usa a chave do Assistente de IA (se for OpenAI)."
            },
            _devOpenAiModel: {
              title: "Modelo",
              description:
                "Em branco, usa o que aparece no campo. Prefira um modelo de raciocínio: escreve código melhor."
            },
            _devGithubRepo: {
              title: "Repositório",
              description: "dono/nome, como aparece no endereço do GitHub."
            },
            _devGithubToken: {
              title: "Token do GitHub",
              description:
                "Token fine-grained. Em Resource owner escolha o dono do repositório (se for uma organização, a organização, não a sua conta), acesso só a este repositório e Contents e Pull requests em leitura e escrita. Se a organização o exigir, aprove o token em Settings › Personal access tokens. Os agentes nunca fazem merge: o PR sai como rascunho."
            },
            _devGithubBranch: {
              title: "Branch base",
              description: "De onde o código é lido e para onde o PR aponta."
            },
            _devAutoApprove: {
              title: "Desenvolver sem aprovação",
              description:
                "Desligado (recomendado), a demanda fica na Priorização até aprovar: nenhum token de código é gasto sem ver a especificação."
            },
            _devAutoTriage: {
              title: "Analisar sugestões de clientes automaticamente",
              description:
                "Sugestões abertas na Ajuda entram no quadro. Ligado, a triagem corre logo; desligado, espera que clique em Analisar."
            },
            _devReviewRounds: {
              title: "Rondas de ajuste",
              description:
                "Quantas vezes o revisor pode devolver o código ao programador antes de pedir uma decisão sua."
            },
            _devTokenLimit: {
              title: "Limite de tokens por demanda",
              description:
                "Teto de segurança: a demanda para com erro ao passar dele. A leitura da cache não entra na conta."
            },
            ticketAcceptedMessage: {
              title: "Ao aceitar a conversa",
              description:
                "Enviada ao cliente quando um agente assume a conversa. Em branco, não é enviado nada.",
              placeholder:
                "Ex.: {{greeting}}, {{firstname}}! Fala o {{user}} e vou continuar o seu atendimento."
            },
            transferMessage: {
              title: "Ao transferir para outra fila",
              description:
                "Enviada ao cliente quando a conversa muda de fila. Se a ligação tiver uma mensagem de transferência própria, vale a dela. Em branco, não é enviado nada.",
              placeholder:
                "Ex.: {{firstname}}, vou passá-lo para a equipa de {{queue}}. Alguém responde a seguir!"
            },
            keepUserAndQueue: {
              title: "Guardar fila e agente ao encerrar",
              description:
                "Ativo: a conversa encerrada mantém a fila e o agente, e volta para eles se for reaberta. Inativo: os dois são removidos ao encerrar."
            },
            autoReopenTimeout: {
              title: "Reabrir conversa recente",
              description:
                "Se o cliente voltar a escrever dentro deste tempo após o encerramento, a mesma conversa é reaberta, em vez de começar outra. 0 desativa."
            },
            userRating: {
              title: "Pedir avaliação ao encerrar",
              description:
                "Ao encerrar a conversa, o cliente recebe um pedido para dar uma nota de 1 a 5 ao atendimento."
            },
            ratingsTimeout: {
              title: "Prazo para avaliar",
              description:
                "Tempo que o cliente tem para enviar a nota. Depois disso, o pedido expira e recebe a mensagem de encerramento."
            },
            tagsMode: {
              title: "Onde ficam as tags",
              description:
                "Na conversa: valem só para esse atendimento. No contacto: acompanham a pessoa em todas as conversas. Nos dois: vão para a conversa e para o contacto.",
              options: {
                ticket: "Na conversa",
                contact: "No contacto",
                both: "Nos dois"
              }
            },
            chatbotAutoExit: {
              title: "Sair do chatbot com resposta fora do menu",
              description:
                "Ativo: se o cliente escrever algo que não é uma opção, a conversa sai do chatbot e passa para um agente. Inativo: o menu é enviado de novo."
            },
            showNumericIcons: {
              title: "Números em emoji no menu",
              description:
                "Mostra as opções do chatbot como 1️⃣ 2️⃣ 3️⃣ em vez de 1, 2, 3."
            },
            chatbotTicketTimeout: {
              title: "O cliente deixou de responder ao chatbot",
              description:
                "A conversa ainda está no menu automático e o cliente não voltou a responder."
            },
            noQueueTimeout: {
              title: "Conversa à espera sem fila",
              description:
                "A conversa chegou, mas ainda não entrou em nenhuma fila."
            },
            openTicketTimeout: {
              title: "Conversa em atendimento parada",
              description:
                "Um agente assumiu a conversa, mas ninguém escreveu nada neste tempo."
            },
            openTicketTimeoutAction: {
              options: {
                pending: "Devolver à fila",
                closed: "Encerrar a conversa"
              }
            },
            scheduleType: {
              title: "Controlo de horário",
              description:
                "Fora do horário, o cliente recebe a mensagem de ausência e a conversa segue a regra abaixo.",
              options: {
                disabled: "Desativado",
                company: "Um horário para toda a empresa",
                queue: "Um horário para cada fila"
              }
            },
            outOfHoursAction: {
              title: "Mensagens fora do horário",
              description:
                "Depois do aviso de ausência, a conversa espera na fila até alguém atender, ou é encerrada de imediato.",
              options: {
                pending: "Esperam na fila",
                closed: "São encerradas"
              }
            },
            messageVisibility: {
              title: "Histórico que o agente vê",
              description:
                "Para conversas que passaram por mais de uma fila: o agente vê só o que foi dito nas filas dele, ou a conversa inteira.",
              options: {
                message: "Só das filas dele",
                ticket: "A conversa inteira"
              }
            },
            quickMessages: {
              title: "Respostas rápidas",
              description:
                "Partilhadas: todos veem e usam as mesmas. Por utilizador: cada um vê só as que criou.",
              options: {
                individual: "Cada utilizador tem as suas",
                company: "Partilhadas"
              }
            },
            call: {
              title: "Chamadas pelo WhatsApp",
              description:
                "O sistema não atende chamadas de voz nem de vídeo. Escolha se o cliente recebe uma mensagem automática a pedir que escreva.",
              options: {
                enabled: "Só ignorar",
                disabled: "Avisar o cliente"
              }
            },
            CheckMsgIsGroup: {
              title: "Ignorar mensagens de grupos",
              description:
                "Ativo: as mensagens de grupos do WhatsApp não se tornam conversas no sistema. Inativo: cada grupo torna-se uma conversa."
            },
            groupsTab: {
              title: "Separador próprio para grupos",
              description:
                "Mostra as conversas de grupos num separador próprio, longe das conversas com clientes."
            },
            soundGroupNotifications: {
              title: "Avisos de mensagens de grupos",
              description:
                "Toca o som e mostra a notificação também quando chega uma mensagem de grupo."
            },
            audioTranscriptions: {
              title: "Transcrever áudios",
              description:
                "Mostra o botão “transcrever” nos áudios da conversa. O áudio só é enviado para a IA quando alguém clica."
            },
            aiProvider: {
              title: "Fornecedor",
              description: "Serviço que transforma o áudio em texto.",
              options: {
                openai: "OpenAI",
                groq: "Groq"
              }
            },
            openAiKey: {
              title: "Chave de acesso",
              description:
                "Chave de API do fornecedor escolhido acima. OpenAI: platform.openai.com › API keys. Groq: console.groq.com › API Keys."
            },
            aiAgentProvider: {
              title: "Fornecedor",
              description:
                "Serviço de IA que conversa com os clientes e sugere respostas à equipa.",
              options: {
                openai: "OpenAI",
                gemini: "Google Gemini",
                groq: "Groq"
              }
            },
            aiAgentApiKey: {
              title: "Chave de acesso",
              description: "Chave de API do fornecedor escolhido acima."
            },
            aiAgentModel: {
              title: "Modelo",
              description:
                "Opcional. Em branco, usa o modelo que aparece no campo."
            },
            apiToken: {
              title: "Token da API",
              description:
                "Chave que outros sistemas usam para criar, consultar, alterar e apagar contactos pela API. Quem tem o token tem esse acesso: guarde-o em local seguro e apague-o se for divulgado."
            },
            klipyApiKey: {
              title: "Chave do KLIPY",
              description:
                "Chave gratuita do klipy.com (o acervo de GIFs e autocolantes do Discord). Com ela, a pesquisa de GIFs e autocolantes do chat usa o KLIPY; sem ela, usa o GIPHY. Vale para todas as empresas."
            },
            uploadLimit: {
              title: "Limite para enviar",
              description:
                "Ficheiros maiores do que isto não seguem como anexo: o cliente recebe uma ligação para os transferir. Em branco, 15 MB."
            },
            downloadLimit: {
              title: "Limite para receber",
              description:
                "Ficheiros recebidos maiores do que isto não são transferidos, e o cliente recebe um aviso automático com o limite. Em branco, 15 MB."
            },
            defaultLanguage: {
              title: "Idioma predefinido",
              description:
                "Idioma das mensagens automáticas quando o contacto, a ligação e a empresa não têm um idioma definido."
            },
            allowSignup: {
              title: "Registo de novas empresas",
              description:
                "Deixa a página de registo aberta para novas empresas criarem conta sozinhas."
            },
            gracePeriod: {
              title: "Carência após o vencimento",
              description:
                "Quantos dias uma empresa com o pagamento em atraso ainda usa o sistema antes de ser bloqueada."
            },
            useMultiThreadedWbot: {
              title: "Ligações em threads separadas",
              description:
                "Executa cada ligação do WhatsApp numa thread própria. Ajuda servidores com muitas ligações. Vale a partir do próximo reinício."
            },
            extension: {
              title: "Extensão de captura do WhatsApp Web",
              description:
                "Gera uma extensão do Chrome com a sua marca para ligar números pelo WhatsApp Web. Extraia o ZIP e carregue a pasta no Chrome como extensão descompactada."
            },
            restart: {
              title: "Reiniciar o servidor",
              description:
                "Reinicia o backend. As ligações caem por alguns instantes e voltam sozinhas; este ecrã recarrega a seguir."
            }
          }
        },
        saving: "A guardar…",
        appearance: {
          tab: "Aparência",
          title: "Tema de cores",
          subtitle:
            "Escolha as cores do sistema para toda a sua equipa. A mudança aparece de imediato no ecrã de todos.",
          mode: "Modo",
          light: "Claro",
          dark: "Escuro",
          custom: "Personalizado",
          customDescription: "Use a cor da sua marca",
          restore: "Repor predefinição",
          applied: "Tema aplicado a toda a equipa",
          restored: "Cores predefinidas repostas",
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
              description: "Azul profissional, sóbrio e fiável"
            },
            forestGreen: {
              name: "Verde Floresta",
              description: "Verde inspirado na natureza"
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
              description: "Rosa intenso e sofisticado"
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
        success: "Configurações salvas com sucesso.",
        title: "Configurações",
        WelcomeGreeting: {
          greetings: "Olá",
          welcome: "Bem-vindo a",
          expirationTime: "Ativo até"
        },
        Options: {
          title: "Opções"
        },
        Companies: {
          title: "Empresas"
        },
        schedules: {
          title: "Horários"
        },
        Plans: {
          title: "Planos"
        },
        Help: {
          title: "Ajuda"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Gateways de pagamento"
        },
        docker: {
          title: "Contentores Docker",
          description:
            "Gira os contentores do servidor: verifique atualizações de imagem, faça pull+reinicie ou reinicie.",
          selfBadge: "este backend",
          notChecked: "Não verificado",
          updateAvailable: "Atualização disponível",
          upToDate: "Atualizado",
          unavailable: "Indisponível",
          unavailableMessage:
            "Serviço Docker indisponível neste servidor. Verifique se o socket do Docker está montado no contentor do backend.",
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
            updatingBackendFrontend: "A atualizar backend e frontend...",
            update: "Pull + reiniciar",
            restart: "Reiniciar"
          },
          toasts: {
            updateAvailable: "Atualização disponível para {{name}}",
            selfUpdate:
              "O backend está a ser atualizado e será reiniciado. Aguarde alguns instantes e recarregue a página.",
            selfRestart:
              "O backend está a reiniciar. Aguarde alguns instantes e recarregue a página.",
            restarted: "{{name}} reiniciado",
            noUpdates: "Nenhuma atualização disponível."
          },
          confirm: {
            updateTitle: "Atualizar {{name}}",
            updateAllTitle: "Atualizar backend e frontend",
            updateAllBody:
              "Os contentores do backend e frontend serão atualizados (pull + recriação). O contentor do backend será reiniciado e a aplicação ficará indisponível por alguns instantes. Deseja continuar?",
            restartTitle: "Reiniciar {{name}}",
            updateBody:
              'Será feito o pull da imagem "{{image}}" e o contentor será recriado com a nova versão. Deseja continuar?',
            restartBody:
              'O contentor "{{name}}" será reiniciado. Deseja continuar?',
            selfWarning:
              "Este é o contentor do backend: a aplicação ficará indisponível por alguns instantes."
          },
          dashboardBanner: {
            title: "Atualizações de contentores disponíveis",
            description:
              "Atualizações de imagem do backend e/ou frontend estão disponíveis.",
            updateAll: "Atualizar backend e frontend",
            updating: "A atualizar...",
            confirmBody:
              "Os contentores do backend e frontend serão atualizados (pull + recriação). O contentor do backend será reiniciado e a aplicação ficará indisponível por cerca de 1 minuto. Deseja continuar?"
          }
        }
      },
      messagesList: {
        transcribe: {
          action: "transcrever",
          loading: "a transcrever…"
        },
        history: {
          load: "Recuperar histórico de mensagens",
          more: "Carregar mensagens mais antigas",
          none: "Não há mensagens anteriores deste contacto",
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
          assignedTo: "Atribuído a:",
          tapForInfo: "Toque para ver os dados do contacto",
          buttons: {
            return: "Retornar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceitar",
            call: "Chamar"
          }
        },
        openPaymentLink: "Abrir link de pagamento"
      },
      messagesInput: {
        ai: {
          improve: "Melhorar resposta",
          tone: "Alterar tom",
          fix: "Corrigir gramática e ortografia",
          suggest: "Sugerir uma resposta",
          summary: "Resumir a conversa",
          ask: "Perguntar ao Copiloto",
          needsText: "Escreva na barra para melhorar o texto",
          writing: "A escrever",
          use: "Usar",
          regenerate: "Gerar outra versão",
          discard: "Descartar",
          keys: "Tab para usar · Esc para descartar",
          done: {
            improve: "Resposta melhorada",
            tone: "Tom",
            fix: "Gramática corrigida",
            suggest: "Resposta sugerida",
            ask: "Resposta do Copiloto"
          },
          tones: {
            professional: "Profissional",
            casual: "Casual",
            direct: "Direto",
            confident: "Confiante",
            friendly: "Amigável"
          }
        },
        linkPreview: {
          loading: "A carregar a pré-visualização…",
          remove: "Enviar sem pré-visualização"
        },
        phone: {
          attach: "Anexar",
          camera: "Câmara",
          gallery: "Fotos e vídeos",
          document: "Documento",
          quickReplies: "Respostas rápidas",
          signature: "Assinatura",
          on: "Ligada",
          off: "Desligada",
          recording: "A gravar",
          discardAudio: "Apagar áudio",
          sendAudio: "Enviar áudio"
        },
        placeholderOpen: "Digite uma mensagem",
        placeholderClosed:
          "Reabra ou aceite este ticket para enviar uma mensagem.",
        signMessage: "Assinar",
        replying: "A responder",
        editing: "A editar"
      },
      message: {
        edited: "Editada"
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
            "A ligação sai do grupo no WhatsApp e deixa de receber as mensagens dele. Para voltar, será preciso um link de convite.",
          left: "Saiu do grupo",
          notMember: "A ligação já não participa neste grupo.",
          join: "Entrar no grupo",
          joinTitle: "Entrar pelo link de convite",
          joinLink: "Link de convite",
          joinHint: "Cole o link de convite deste grupo (chat.whatsapp.com/…).",
          joined: "Pronto! A ligação voltou ao grupo."
        },
        media: {
          title: "Multimédia, ligações e docs",
          media: "Multimédia",
          docs: "Docs",
          links: "Ligações",
          empty_media: "Nenhuma foto ou vídeo trocado com este contacto.",
          empty_docs: "Nenhum documento trocado com este contacto.",
          empty_links: "Nenhuma ligação trocada com este contacto.",
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
          tags: "Etiquetas",
          none: "Nenhuma",
          queue: "Fila",
          noQueue: "Sem fila",
          attendant: "Atendente",
          unassigned: "Sem atendente",
          connection: "Ligação",
          ticket: "Atendimento",
          status: {
            open: "Em atendimento",
            pending: "Em espera",
            closed: "Resolvido",
            group: "Grupo"
          }
        },
        header: "Dados do contacto",
        buttons: {
          edit: "Editar contacto"
        },
        extraInfo: "Outras informações"
      },
      ticketContextMenu: {
        preview: "Espreitar conversa",
        markUnread: "Marcar como não lida",
        resolve: "Marcar como resolvida",
        pending: "Deixar pendente",
        snooze: "Adiar",
        priority: "Prioridade",
        tags: "Atribuir etiqueta",
        agent: "Atribuir agente",
        queue: "Atribuir fila",
        openNewTab: "Abrir num novo separador",
        copyLink: "Copiar ligação da conversa",
        delete: "Eliminar conversa",
        loading: "A carregar…",
        me: "(você)",
        empty: {
          tags: "Ainda não há etiquetas.",
          agents: "Nenhum agente encontrado.",
          queues: "Ainda não há filas."
        },
        priorities: {
          none: "Nenhuma",
          low: "Baixa",
          medium: "Média",
          high: "Alta",
          urgent: "Urgente"
        },
        priorityTooltip: "Prioridade: {{level}}",
        snoozeOptions: {
          reply: "Até o cliente responder",
          hour: "Durante 1 hora",
          tomorrow: "Até amanhã",
          nextWeek: "Até à próxima semana",
          custom: "Escolher data e hora…",
          clear: "Retirar o adiamento"
        },
        snoozeDialog: {
          title: "Adiar a conversa até",
          confirm: "Adiar",
          cancel: "Cancelar"
        },
        toasts: {
          unread: "Marcada como não lida",
          resolved: "Conversa resolvida",
          pending: "Conversa devolvida à fila",
          snoozed: "Adiada até {{when}}",
          snoozedReply: "Adiada até o cliente responder",
          unsnoozed: "A conversa voltou à lista",
          assigned: "Atribuída a {{name}}",
          queued: "Enviada para a fila {{name}}",
          copied: "Ligação copiada",
          deleted: "Conversa eliminada"
        }
      },
      newConversation: {
        title: "Nova conversa",
        subtitle: "Escolha por onde sai a mensagem e para quem.",
        inbox: "Caixa de entrada",
        connected: "Ligado",
        disconnected: "Desligado",
        noInbox: "Nenhum WhatsApp ligado para iniciar conversa.",
        to: "Para",
        searchContact: "Nome ou número",
        changeContact: "Trocar contacto",
        queue: "Fila",
        noQueue: "Sem fila",
        cancel: "Cancelar",
        start: "Iniciar conversa"
      },
      ticketOptionsMenu: {
        schedule: "Agendamento",
        delete: "Eliminar",
        transfer: "Transferir",
        appointmentsModal: {
          title: "Observações do Atendimento",
          textarea: "Observação",
          placeholder: "Insira aqui a informação que deseja registar"
        },
        confirmationModal: {
          title: "Eliminar o ticket do contacto",
          message:
            "Atenção! Todas as mensagens relacionadas ao ticket serão perdidas."
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
        composing: "A digitar...",
        recording: "A gravar...",
        paused: "Em pausa"
      },
      privacyModal: {
        success: "Privacidade atualizada",
        title: "Editar Privacidade do WhatsApp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Salvar"
        },
        form: {
          menu: {
            all: "Todos",
            none: "Ninguém",
            contacts: "Meus contactos",
            contact_blacklist: "Contactos selecionados",
            match_last_seen: "Semelhante ao Visto por Último",
            known: "Conhecidos",
            disable: "Desativada",
            hrs24: "24 Horas",
            dias7: "7 Dias",
            dias90: "90 Dias"
          },
          readreceipts: "Para atualizar a privacidade dos recibos de leitura",
          profile: "Para atualizar a privacidade da foto do perfil",
          status: "Para atualizar a privacidade dos estados",
          online: "Para atualizar a privacidade online",
          last: "Para atualizar a privacidade do Último Visto",
          groupadd: "Para atualizar a privacidade de Adicionar a grupos",
          calladd: "Para atualizar a privacidade de Adicionar a Chamadas",
          disappearing: "Para atualizar o Modo de Desaparecimento Padrão"
        }
      },
      phoneNumberInput: {
        country: "País",
        phoneNumber: "Telefone",
        localNumber: "Telefone"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR:
          "Erro de configuração. Por favor, contacte o suporte.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Relógio fora de sincronização. Verifique as configurações de data e hora do seu dispositivo.",
        ERR_BACKEND_UNREACHABLE:
          "Backend inacessível. Por favor, tente novamente mais tarde.",
        ERR_BACKEND_NOT_READY:
          "O backend está a iniciar e ainda não está pronto. A tentar novamente automaticamente."
      },
      backendErrors: {
        ERR_DEV_TEST_NO_BROWSER: "O navegador de testes não está configurado",
        ERR_CODE_NOT_SENT:
          "Não foi possível enviar o código para o seu e-mail. Tente novamente dentro de instantes.",
        ERR_CODE_EXPIRED:
          "O código expirou. Entre novamente para receber outro.",
        ERR_CODE_INVALID:
          "Código incorreto. Verifique o e-mail e tente novamente.",
        ERR_WAIT_TO_RESEND: "Aguarde alguns segundos para pedir outro código.",
        ERR_EMAIL_DISABLED:
          "O envio de e-mails não está configurado. Fale com o administrador.",
        ERR_RESET_LINK_EXPIRED:
          "Esta ligação expirou ou já foi usada. Peça uma nova.",
        ERR_PASSWORD_TOO_SHORT:
          "A palavra-passe precisa de ter pelo menos 6 caracteres.",
        ERR_NOT_A_GROUP: "Esta conversa não é de um grupo.",
        ERR_GROUP_LEAVE:
          "Não foi possível sair do grupo agora. Tente novamente.",
        ERR_INVALID_INVITE: "Link de convite inválido ou expirado.",
        ERR_INVITE_OTHER_GROUP: "Esse link é de outro grupo.",
        ERR_INVALID_ADDRESS:
          "Morada inválida. Verifique o código postal e o número.",
        ERR_TRANSCRIPTION_DISABLED:
          "Transcrição de áudio desativada ou sem chave de IA configurada.",
        ERR_TRANSCRIPTION_FAILED: "Não foi possível transcrever o áudio.",
        ERR_NOT_AUDIO: "Esta mensagem não é um áudio.",
        ERR_INTERNAL:
          "Erro interno do servidor. Por favor, contacte o suporte.",
        ERR_UNAUTHORIZED: "Não autorizado. Por favor, faça o login novamente.",
        ERR_INVALID_PRIORITY: "Prioridade inválida.",
        ERR_INVALID_SNOOZE:
          "Escolha uma data e hora no futuro para adiar a conversa.",
        ERR_AI_NOT_CONFIGURED:
          "A IA não está configurada. Adicione a chave em Definições > Opções > Inteligência artificial.",
        ERR_AI_EMPTY_TEXT: "Escreva algo na barra primeiro.",
        ERR_AI_NO_MESSAGES:
          "Ainda não há mensagens nesta conversa para a IA ler.",
        ERR_AI_UNAVAILABLE:
          "A IA não respondeu agora. Tente de novo daqui a pouco.",
        ERR_AI_INVALID_TONE: "Tom inválido.",
        ERR_AI_INVALID_ACTION: "Ação de IA inválida.",
        ERR_INBOX_UNAVAILABLE:
          "Esta caixa de entrada não pode iniciar conversa agora (desligada ou não é WhatsApp).",
        ERR_DEV_BUSY:
          "A demanda está em execução: espere que os agentes terminem",
        ERR_DEV_INVALID_STAGE:
          "Esta ação não é válida na etapa atual da demanda",
        ERR_DEV_TITLE_REQUIRED: "Dê um título à demanda",
        ERR_DEV_COMMENT_REQUIRED: "Escreva o comentário",
        ERR_DEV_SKILL_REQUIRED: "Escreva o nome e o conteúdo da skill",
        ERR_DEV_AI_NOT_CONFIGURED:
          "Falta a chave da IA do pipeline nas definições",
        ERR_DEV_AI_AUTH: "A chave da IA foi recusada",
        ERR_DEV_AI_MODEL:
          "O modelo escolhido não existe ou não está disponível para esta chave",
        ERR_DEV_AI_RATE_LIMIT:
          "Limite de utilização da IA atingido: tente daqui a pouco",
        ERR_DEV_AI_OFFLINE: "Sem ligação à IA",
        ERR_DEV_AI_REFUSAL: "A IA recusou o pedido",
        ERR_DEV_AI_TRUNCATED:
          "A resposta da IA ficou grande demais e foi cortada",
        ERR_DEV_AI_FORMAT: "A IA respondeu fora do formato combinado",
        ERR_DEV_AI_FAILED: "A IA devolveu um erro",
        ERR_FORBIDDEN:
          "Acesso negado. Você não tem permissão para acessar este recurso.",
        ERR_CHECK_NUMBER: "Número não encontrado no Whatsapp.",
        ERR_NO_OTHER_WHATSAPP: "Deve haver pelo menos um WhatsApp padrão.",
        ERR_NO_DEF_WAPP_FOUND:
          "Nenhum WhatsApp padrão encontrado. Verifique a página de conexões.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sessão do WhatsApp não foi inicializada. Verifique a página de conexões.",
        ERR_WAPP_CHECK_CONTACT:
          "Não foi possível verificar o contacto do WhatsApp. Verifique a página de conexões",
        ERR_WAPP_INVALID_CONTACT: "Este não é um número de WhatsApp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Não foi possível baixar mídia do WhatsApp. Verifique a página de conexões.",
        ERR_USER_INACTIVE:
          "O seu acesso está desativado. Fale com o administrador da sua empresa.",
        ERR_INVALID_CREDENTIALS:
          "Erro de autenticação. Por favor, tente novamente.",
        ERR_SENDING_WAPP_MSG:
          "Erro ao enviar mensagem do WhatsApp. Verifique a página de conexões.",
        ERR_DELETE_WAPP_MSG: "Não foi possível excluir a mensagem do WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Não foi possível editar a mensagem do WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Já existe um ticket aberto para este contacto.",
        ERR_SESSION_EXPIRED: "Sessão expirada. Por favor entre novamente.",
        ERR_USER_CREATION_DISABLED:
          "A criação do utilizador foi desabilitada pelo administrador.",
        ERR_NO_PERMISSION: "Você não tem permissão para acessar este recurso.",
        ERR_TOO_MANY_ATTEMPTS:
          "Demasiadas tentativas. Aguarde alguns minutos e tente novamente.",
        ERR_DUPLICATED_CONTACT: "Já existe um contacto com este número.",
        ERR_NO_SETTING_FOUND: "Nenhuma configuração encontrada com este ID.",
        ERR_NO_CONTACT_FOUND: "Nenhum contacto encontrado com este ID.",
        ERR_NO_TICKET_FOUND: "Nenhum ticket encontrado com este ID.",
        ERR_NO_USER_FOUND: "Nenhum utilizador encontrado com este ID.",
        ERR_NO_WAPP_FOUND: "Nenhum WhatsApp encontrado com este ID.",
        ERR_CREATING_MESSAGE: "Erro ao criar mensagem na base de dados.",
        ERR_CREATING_TICKET: "Erro ao criar ticket na base de dados.",
        ERR_FETCH_WAPP_MSG:
          "Erro ao buscar a mensagem no WhatsApp, talvez ela seja muito antiga.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Esta cor já está em uso, escolha outra.",
        ERR_WAPP_GREETING_REQUIRED:
          "A mensagem de saudação é obrigatória quando há mais de uma fila.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Assinatura inválida ou não encontrada",
        ERR_WAPP_NOT_FOUND: "Conexão indisponível",
        ERR_SUBSCRIPTION_EXPIRED: "Assinatura expirada",
        ERR_UNKOWN: "Erro desconhecido"
      }
    }
  }
};

export { messages };
