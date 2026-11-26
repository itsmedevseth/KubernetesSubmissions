# DevSecOps Learning Resources

A curated list of resources for a fullstack developer (with Docker and Jenkins experience) moving into DevSecOps, organized by roadmap phase. Most are free; paid options mainly add structure and certificates.

> Course prices and availability change. Check the current details before paying for anything.

---

## Phase 1: Application Security

- **[PortSwigger Web Security Academy](https://portswigger.net/web-security)** (free)
  The best single resource on this list. Written explanations plus interactive labs for every major web vulnerability class. Start with the Apprentice and Practitioner labs for SQL injection, XSS, access control, authentication, SSRF, and JWT attacks.

- **[OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)** (free)
  A deliberately vulnerable Node/Angular web app. Hack it, then build the pipeline that would have caught the bugs.

- **"Alice and Bob Learn Application Security"** by Tanya Janca (book)
  Developer-friendly coverage of secure coding and building security into the SDLC. Covers the defensive and process side that the labs don't.

- **[OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)** (free)
  Enough to start threat modeling with STRIDE.

- **"Threat Modeling: Designing for Security"** by Adam Shostack (book)
  For when you want depth on threat modeling.

---

## Phase 2: Cloud and Terraform

- **[HashiCorp Terraform Tutorials](https://developer.hashicorp.com/terraform/tutorials)** (free)
  Well structured and kept current.

- **"Terraform: Up & Running"** by Yevgeniy Brikman (book)
  The standard book for understanding state, modules, and team workflows.

- **[AWS Skill Builder](https://skillbuilder.aws/)** (free tier available)
  Solid IAM and security fundamentals.

- **[Adrian Cantrill's AWS courses](https://learn.cantrill.io/)** (paid)
  Widely regarded as the most thorough option for AWS certification prep.

- **[flAWS.cloud](http://flaws.cloud/) and [flAWS2.cloud](http://flaws2.cloud/)** (free)
  Short CTF-style challenges that teach common AWS misconfigurations by exploiting them. A few hours each.

- **[CloudGoat](https://github.com/RhinoSecurityLabs/cloudgoat)** (free, runs in your own AWS account)
  Vulnerable AWS environments deployed with Terraform. **Destroy them afterward** to avoid charges.

---

## Phase 3: CI/CD and Pipeline Security

- **[OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)** (free)
  Overview of which scan types belong at which pipeline stage.

- **[OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/)** (free)
  The threat model for pipelines themselves, such as poisoned pipeline execution and credential hygiene.

- **[Jenkins: Securing Jenkins](https://www.jenkins.io/doc/book/security/)** (free)
  Authoritative source for controller hardening.

- **[Jenkins Security Advisories](https://www.jenkins.io/security/advisories/)** (free)
  Reading a few is a quick way to see how real Jenkins vulnerabilities work.

- **Scanner documentation** (free): [Trivy](https://trivy.dev/), [Semgrep](https://semgrep.dev/docs/), [Gitleaks](https://github.com/gitleaks/gitleaks), [Checkov](https://www.checkov.io/)
  Often better than courses for learning the tools themselves.

- **[Semgrep Playground](https://semgrep.dev/playground)** (free)
  Interactive environment for learning to write custom rules.

- **[OWASP WrongSecrets](https://owasp.org/www-project-wrongsecrets/)** (free)
  Challenges about the wrong ways to handle secrets across Docker, Kubernetes, and cloud. Bridges Phases 3 and 4.

---

## Phase 4: Container and Kubernetes Security

- **"Container Security"** by Liz Rice (book)
  How containers work at the Linux level (namespaces, cgroups, capabilities). Fills the gaps that hands-on Docker use leaves.

- **"Hacking Kubernetes"** by Andrew Martin and Michael Hausenblas (book)
  Kubernetes from the attacker's perspective.

- **[Kubernetes Goat](https://madhuakula.com/kubernetes-goat/)** (free)
  A deliberately vulnerable cluster with guided scenarios. Run it locally with kind or k3d.

- **[KodeKloud](https://kodekloud.com/)** (paid, some free content)
  Browser-based hands-on labs, plus popular CKA/CKS exam prep.

- **[Killer.sh](https://killer.sh/)** (included with CKA/CKS exam registration)
  Exam simulator that is harder than the real exam.

---

## Phase 5: Supply Chain Security and Monitoring

- **[SLSA](https://slsa.dev/)** (free)
  Framework for build provenance and supply chain integrity.

- **[Sigstore / Cosign documentation](https://docs.sigstore.dev/)** (free)
  Signing and verifying container images and artifacts.

- **CNCF Software Supply Chain Best Practices** (free, published by the CNCF Security TAG)
  Overview of how the supply chain pieces fit together.

---

## Structured Paths (Optional)

- **[TryHackMe DevSecOps Path](https://tryhackme.com/)** (inexpensive subscription)
  Browser-based rooms covering pipeline security, container security, and IaC. A good backbone to supplement with the deeper resources above.

- **[Practical DevSecOps: Certified DevSecOps Professional (CDP)](https://www.practical-devsecops.com/)** (paid)
  Lab-based exams focused on this exact role. Less known to employers than AWS or CNCF certifications.

---

## Suggested Sequence

1. **Months 1–2:** PortSwigger Academy + Juice Shop. In parallel, add security stages to a Jenkins pipeline.
2. **Months 3–4:** flAWS / flAWS2, Terraform tutorials, AWS IAM fundamentals, CloudGoat.
3. **Months 5–7:** "Container Security", Kubernetes Goat, CKA → CKS prep.
4. **Ongoing:** SLSA, Sigstore, and monitoring.

**Throughout:** keep everything centered on one project that you harden end to end (threat model → secure code → container → Terraform → secure pipeline → Kubernetes policies → signed images → monitoring). Document your decisions in the README. That project is what demonstrates the skill.
