# Pitfalls Research

**Domain:** E-Learning Platform
**Researched:** 2026-04-07
**Confidence:** HIGH

## Critical Pitfalls

1. **Auth token handling in localStorage**
   - Risque XSS, invalidation de session
   - Mitigation: limiter exposition token et gerer 401 correctement

2. **Incoherence API URL frontend/backend**
   - Requetes cassees selon environnement
   - Mitigation: `VITE_API_URL` unique et documentee

3. **Schema DB drift**
   - Migrations non synchronisees avec models
   - Mitigation: migrations Laravel obligatoires pour chaque changement schema

4. **Progress tracking non persistant**
   - UX degradee
   - Mitigation: persistance server-side frequente

5. **Upload fichiers sans controle**
   - Temps de reponse, securite, stockage
   - Mitigation: validations MIME/taille, stockage structure

6. **Docs non alignees sur le code reel**
   - Mauvaises decisions techniques
   - Mitigation: MAJ docs a chaque decision de stack

---
*Pitfalls aligned to Laravel baseline*
