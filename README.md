⚡ SCAMZ OS | Discord Management System 0x1
Un système de gestion centralisé pour Discord, offrant un contrôle total sur vos serveurs via une interface SaaS moderne, sécurisée et 100% locale.

🖥️ [Aperçu de l'Interface de Connexion](src/assets/login.png)
SCAMZ OS privilégie la sécurité. La connexion s'effectue via un token de bot Discord, garantissant qu'aucune donnée ne quitte votre machine.

🛠️ [Fonctionnalités Clés](src/assets/dashboard.png)
📊 1. Dashboard Opérationnel
Le centre de contrôle principal pour surveiller l'état de votre bot et les activités système en temps réel via une console intégrée.

Mode DIRECT : Connexion ultra-rapide sans intermédiaire.

Monitoring : Visualisation immédiate du nombre de serveurs actifs.

Local Logs : Suivi précis de chaque injection et modification.

🧩 2. [Gestionnaire de Serveurs Avancé](src/assets/server_list.png)
Une interface fluide pour naviguer entre vos différentes guildes et accéder aux outils d'édition.

GÉRER : Un clic suffit pour ouvrir l'éditeur de rôles et de salons.

OSINT Tool Integration : Modules de reconnaissance intégrés pour chaque serveur.

✉️ 3. [Centre de Messagerie](src/assets/messenger.png)
Un moteur de diffusion puissant pour envoyer des messages ou des commandes à travers vos terminaux sélectionnés.

Sélection de Terminal : Choisissez précisément le salon cible.

Injection Directe : Interface de saisie optimisée pour la rapidité.

🚀 Installation & Build
Bash
# Cloner le projet
git clone https://github.com/votre-repo/scamzos.git

# Accéder au dossier
cd scamzos

# Installer les dépendances
npm install

# Lancer en mode développement
npm start
📦 Création de l'exécutable (.exe)
Pour générer une version installable avec l'icône icon.ico intégrée :

Bash
npm run build
📂 Structure du Projet
main.js : Processus principal Electron (Gestion des fenêtres et IPC).

app.js : Logique applicative et interactions avec l'API Discord.

index.html : Structure de l'interface utilisateur (Tailwind CSS).

icon.ico : Ressource graphique pour l'exécutable Windows.

📞 Support & Contact
Besoin d'aide ou d'une version personnalisée ?

Discord : scamzuhq

Telegram : @scamzuhq

Website : guns.lol/scamz

⭐ N'hésite pas à laisser une star si ce projet t'est utile !