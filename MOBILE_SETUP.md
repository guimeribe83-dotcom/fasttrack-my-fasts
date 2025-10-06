# 📱 Configuração do App Android - FastTrack

Este guia explica como configurar e publicar o app FastTrack na Google Play Store.

## ✅ O que já está pronto

- ✅ Capacitor instalado e configurado
- ✅ Notificações locais nativas implementadas
- ✅ Sistema de lembretes funcionando nativamente
- ✅ Configuração do servidor apontando para o ambiente de produção

## 🚀 Passos para rodar no Android

### 1. Exportar para GitHub
1. No Lovable, clique no botão "Export to GitHub" no canto superior direito
2. Faça git clone do seu repositório no seu computador local

### 2. Instalar Dependências
```bash
cd seu-projeto
npm install
```

### 3. Adicionar Plataforma Android
```bash
npx cap add android
```

### 4. Atualizar Dependências Nativas
```bash
npx cap update android
```

### 5. Build do Projeto
```bash
npm run build
```

### 6. Sincronizar com Capacitor
```bash
npx cap sync
```

### 7. Abrir no Android Studio
```bash
npx cap open android
```

## 📋 Requisitos do Sistema

### Para desenvolvimento Android:
- **Android Studio** instalado (última versão)
- **Java JDK 17** ou superior
- **Android SDK** (instalado via Android Studio)
- **Um dispositivo físico** ou emulador Android configurado

## 🔔 Sobre as Notificações

### Funcionamento
- As notificações são **nativas do Android** usando `@capacitor/local-notifications`
- Quando o usuário adiciona um lembrete, ele é agendado automaticamente
- As notificações se repetem diariamente no horário configurado
- Funciona mesmo com o app fechado (background)

### Permissões
- O app solicita permissão de notificações automaticamente
- No Android 13+, a permissão é obrigatória e aparece na primeira vez que o usuário acessa a aba Lembretes
- As notificações só funcionam após o usuário conceder a permissão

## 📱 Testando no Dispositivo Real

### Opção 1: Via USB (Modo Debug)
```bash
# Conecte seu celular via USB
# Ative o modo desenvolvedor no Android
# Ative a depuração USB
npx cap run android
```

### Opção 2: Via Android Studio
1. Abra o projeto no Android Studio: `npx cap open android`
2. Conecte seu dispositivo ou inicie um emulador
3. Clique em "Run" (ícone de play verde)

## 🏪 Publicando na Play Store

### 1. Preparar o Build de Release

#### 1.1 Criar Keystore (apenas na primeira vez)
```bash
keytool -genkey -v -keystore fasttrack-release.keystore -alias fasttrack -keyalg RSA -keysize 2048 -validity 10000
```
**⚠️ IMPORTANTE:** Guarde a senha do keystore em um local seguro! Você precisará dela para todas as atualizações futuras.

#### 1.2 Configurar Gradle
Edite `android/app/build.gradle` e adicione:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../fasttrack-release.keystore")
            storePassword "SUA_SENHA_AQUI"
            keyAlias "fasttrack"
            keyPassword "SUA_SENHA_AQUI"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 1.3 Atualizar versão do app
Edite `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1  // Incremente para cada nova versão (1, 2, 3...)
        versionName "1.0.0"  // Versão visível para usuários
    }
}
```

### 2. Gerar APK/Bundle de Release

#### Para APK:
```bash
cd android
./gradlew assembleRelease
```
O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

#### Para Bundle (recomendado para Play Store):
```bash
cd android
./gradlew bundleRelease
```
O Bundle estará em: `android/app/build/outputs/bundle/release/app-release.aab`

### 3. Configurar no Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo aplicativo
3. Preencha as informações básicas:
   - Nome: FastTrack - Jejum Espiritual
   - Descrição curta e completa
   - Screenshots (pelo menos 2)
   - Ícone do app (512x512 px)
   - Banner (1024x500 px)

4. Configure a classificação de conteúdo
5. Configure a política de privacidade
6. Faça upload do `.aab` na seção "Produção"

### 4. Informações Importantes para a Play Store

#### Descrição Curta (até 80 caracteres)
```
Acompanhe seu jejum espiritual com lembretes personalizados
```

#### Descrição Completa
```
FastTrack é o aplicativo ideal para acompanhar seu jejum espiritual com facilidade e organização.

🙏 RECURSOS PRINCIPAIS:
• Crie e gerencie jejuns personalizados
• Divida seu jejum em blocos/etapas
• Acompanhe seu progresso diário
• Configure lembretes personalizados
• Visualize seu histórico completo em calendário
• Suporte para múltiplos idiomas (Português, Inglês, Espanhol)

📅 ORGANIZE SEU JEJUM:
• Defina a duração total do jejum
• Divida em etapas (ex: arroz, carne, doces)
• Marque dias como concluídos ou não concluídos
• Registre dias já completados antes de usar o app

🔔 LEMBRETES INTELIGENTES:
• Configure múltiplos lembretes diários
• Notificações nativas do Android
• Personalize o texto de cada lembrete
• Ative/desative lembretes individualmente

📊 ACOMPANHAMENTO:
• Visualize estatísticas do seu jejum
• Calendário com dias concluídos/pendentes
• Progresso em tempo real
• Histórico completo de todos os seus jejuns

✨ INTERFACE MODERNA:
• Design limpo e profissional
• Modo claro/escuro
• Fácil de usar
• Totalmente em português

Ideal para quem busca uma ferramenta simples e eficaz para acompanhar jejuns espirituais como o Jejum de Daniel, jejum de 21 dias, jejum corporativo e muito mais!
```

#### Categoria
- Estilo de Vida

#### Classificação de Conteúdo
- PEGI 3 / Livre para todos

## 🔧 Solução de Problemas

### Notificações não aparecem
1. Verifique se a permissão foi concedida nas configurações do Android
2. Confira se os lembretes estão ativos (switch ligado)
3. Teste em horário próximo ao configurado

### Build falha
1. Certifique-se que o Android Studio está atualizado
2. Execute `npx cap sync` novamente
3. Limpe o cache: `cd android && ./gradlew clean`

### App não conecta ao servidor
1. Verifique sua conexão com internet
2. Confirme que o URL do servidor está correto no `capacitor.config.ts`
3. Teste primeiro no navegador web

## 📚 Recursos Adicionais

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Local Notifications Plugin](https://capacitorjs.com/docs/apis/local-notifications)
- [Publicar na Play Store](https://support.google.com/googleplay/android-developer/answer/9859152)

## 💡 Dicas

1. **Teste bastante** antes de publicar na Play Store
2. **Incremente versionCode** a cada atualização
3. **Guarde o keystore** em local seguro (e faça backup!)
4. **Responda reviews** dos usuários rapidamente
5. **Atualize regularmente** para manter o app relevante

## 🎯 Próximos Passos Recomendados

Depois de publicar:
1. Configure analytics (Firebase, por exemplo)
2. Adicione crash reporting
3. Implemente sincronização offline
4. Adicione widget para tela inicial
5. Suporte para backup em nuvem

---

**Desenvolvido com ❤️ usando Lovable + Capacitor**
