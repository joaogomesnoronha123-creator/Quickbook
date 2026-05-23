export type Language = 'Português (BR)' | 'English (US)';

export const translations = {
  'Português (BR)': {
    home: {
      greeting: 'Olá',
      question: 'O que vamos aprender hoje?',
      subtitle: 'Seu assistente inteligente transformando conteúdo denso em clareza absoluta.',
      newSummary: 'Novo Resumo',
      library: 'Biblioteca',
      createStudy: 'Criar estudo com IA',
      accessSaved: 'Acessar salvos',
      protectBooks: 'Proteja seus livros',
      protectSubtitle: 'Você está usando uma conta temporária. Vincule seu e-mail para que ninguém use seu nome e para não perder seus resumos ao limpar o navegador.',
      linkGoogle: 'Vincular com Google'
    },
    summarizer: {
      title: 'Novo Estudo',
      subtitle: 'Extraia a essência de livros e artigos em segundos.',
      upload: 'Enviar arquivo do livro',
      maxSize: 'PDF ou TXT',
      pasteText: 'Ou descreva o conteúdo/instruções',
      generate: 'Gerar Resumo Inteligente',
      generating: 'Analisando conteúdo...',
      placeholder: 'Cole o conteúdo que deseja estudar ou descreva o que a IA deve fazer com o livro...',
      fileSuccess: 'Arquivo carregado com sucesso!',
      fileError: 'Erro ao ler arquivo. Tente um formato de texto.',
      pdfNoText: 'Não conseguimos encontrar texto neste PDF. Ele pode ser uma imagem (scan).',
      summarizeError: 'Ocorreu um erro ao gerar o resumo. Tente novamente.',
      voiceStart: 'Falar conteúdo',
      voiceStop: 'Ouvindo...',
      voiceNotSupported: 'Voz não suportada neste navegador.'
    },
    library: {
      title: 'Minha Biblioteca',
      subtitle: 'Todos os seus conhecimentos destilados e organizados por data.',
      noBooks: 'Nenhum resumo encontrado.',
      startStudy: 'Começar um estudo',
      lastEdit: 'Última edição'
    },
    settings: {
      title: 'Configurações',
      subtitle: 'Gerencie seu perfil e as preferências de leitura do QuickBook AI.',
      profile: 'Perfil',
      userName: 'Seu Nome',
      appLanguage: 'Idioma do App',
      appTheme: 'Tema do App',
      themeLight: 'Claro',
      themeDark: 'Escuro',
      preferences: 'Preferências',
      notifications: 'Notificações Inteligentes',
      security: 'Dados & Segurança',
      clearLibrary: 'Limpar Biblioteca',
      logout: 'Encerrar Sessão',
      editName: 'Como quer ser chamado?',
      save: 'Salvar',
      cancel: 'Cancelar'
    },
    nav: {
      home: 'Início',
      library: 'Biblioteca',
      summarizer: 'Resumir',
      assistant: 'Assistente',
      settings: 'Ajustes'
    },
    auth: {
      login: 'Entrar',
      register: 'Criar Conta',
      email: 'E-mail',
      password: 'Senha',
      noAccount: 'Não tem uma conta?',
      hasAccount: 'Já tem uma conta?',
      anonymous: 'Anônimo (Temp)',
      guest: 'Entrar sem Login',
      google: 'Entrar com Google',
      forgotPassword: 'Esqueci minha senha',
      resetPassword: 'Redefinir Senha',
      backToLogin: 'Voltar para o Login',
      resetSent: 'Link de redefinição enviado para seu e-mail!',
      error: 'Erro ao processar. Verifique seus dados.',
      title: 'Bem-vindo ao QuickBook AI',
      errors: {
        invalidEmail: 'E-mail inválido.',
        userNotFound: 'Usuário não encontrado.',
        wrongPassword: 'Senha incorreta.',
        emailInUse: 'Este e-mail já está em uso.',
        weakPassword: 'A senha é muito fraca.',
        tooManyRequests: 'Muitas tentativas. Tente mais tarde.',
        networkError: 'Erro de conexão.',
        popupClosed: 'Login cancelado.',
        operationNotAllowed: 'Operação não permitida.',
        userDisabled: 'Usuário desativado.',
        permissionDenied: 'Erro de permissão no banco de dados.'
      }
    },
    chat: {
      title: 'Assistente IA',
      placeholder: 'Como posso ajudar nos seus estudos?',
      welcome: 'Olá! Sou o seu assistente inteligente. Como posso te ajudar hoje?',
      send: 'Enviar'
    }
  },
  'English (US)': {
    home: {
      greeting: 'Hello',
      question: 'What are we learning today?',
      subtitle: 'Your intelligent assistant transforming dense content into absolute clarity.',
      newSummary: 'New Summary',
      library: 'Library',
      createStudy: 'Create AI study',
      accessSaved: 'Access saved',
      protectBooks: 'Protect your books',
      protectSubtitle: 'You are using a temporary account. Link your email so no one else uses your name and to avoid losing your summaries when clearing the browser.',
      linkGoogle: 'Link with Google'
    },
    summarizer: {
      title: 'New Study',
      subtitle: 'Extract the essence of books and articles in seconds.',
      upload: 'Upload book file',
      maxSize: 'PDF or TXT',
      pasteText: 'Or describe content/instructions',
      generate: 'Generate Smart Summary',
      generating: 'Analyzing content...',
      placeholder: 'Paste the content you want to study or describe what the AI should do with the book...',
      fileSuccess: 'File loaded successfully!',
      fileError: 'Error reading file. Try a text format.',
      pdfNoText: 'We could not find text in this PDF. It might be an image (scan).',
      summarizeError: 'An error occurred while generating the summary. Please try again.',
      voiceStart: 'Speak content',
      voiceStop: 'Listening...',
      voiceNotSupported: 'Voice not supported in this browser.'
    },
    library: {
      title: 'My Library',
      subtitle: 'All your distilled knowledge organized by date.',
      noBooks: 'No summaries found.',
      startStudy: 'Start a study',
      lastEdit: 'Last edit'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile and QuickBook AI reading preferences.',
      profile: 'Profile',
      userName: 'Your Name',
      appLanguage: 'App Language',
      appTheme: 'App Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      preferences: 'Preferences',
      notifications: 'Smart Notifications',
      security: 'Data & Security',
      clearLibrary: 'Clear Library',
      logout: 'Logout',
      editName: 'How would you like to be called?',
      save: 'Save',
      cancel: 'Cancel'
    },
    nav: {
      home: 'Home',
      library: 'Library',
      summarizer: 'Summarize',
      assistant: 'Assistant',
      settings: 'Settings'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      anonymous: 'Anonymous (Temp)',
      guest: 'Enter without Login',
      google: 'Sign in with Google',
      forgotPassword: 'Forgot my password',
      resetPassword: 'Reset Password',
      backToLogin: 'Back to Login',
      resetSent: 'Reset link sent to your email!',
      error: 'Authentication error. Check your credentials.',
      title: 'Welcome to QuickBook AI',
      errors: {
        invalidEmail: 'Invalid email address.',
        userNotFound: 'User not found.',
        wrongPassword: 'Incorrect password.',
        emailInUse: 'Email already in use.',
        weakPassword: 'Password is too weak.',
        tooManyRequests: 'Too many attempts. Try again later.',
        networkError: 'Network error. Please check your connection.',
        popupClosed: 'Login process was cancelled.',
        operationNotAllowed: 'This operation is not allowed.',
        userDisabled: 'This user account has been disabled.',
        permissionDenied: 'Database permission error.'
      }
    },
    chat: {
      title: 'AI Assistant',
      placeholder: 'How can I help with your studies?',
      welcome: 'Hello! I am your smart assistant. How can I help you today?',
      send: 'Send'
    }
  }
};
