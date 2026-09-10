# Routes

The intended URL structure (see the project spec). Status is updated as each phase lands — an entry listed here is _planned_, not necessarily built yet.

| Route                                                                                                                              | Status                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/`                                                                                                                                | ✅ Implemented (Phase 1, landing page)                                                      |
| `/login`, `/register`, `/setup/[token]`                                                                                            | ✅ Implemented (Phase 3/4)                                                                  |
| `/home`                                                                                                                            | ✅ Implemented (Phase 7, real aggregated dashboard)                                         |
| `/home/hausaufgaben`, `/home/todos`, `/home/stundenplan`, `/home/termine`, `/home/pruefungen`, `/home/faecher`                     | ✅ Implemented (Phase 8–11)                                                                 |
| `/cloud`, `/cloud/privat`, `/cloud/klasse`, `/cloud/klasse/[classSlug]`                                                            | ✅ Implemented (Phase 12–13)                                                                |
| `/klasse`, `/klasse/[classSlug]/uebersicht`, `/klasse/[classSlug]/mitglieder`                                                      | ✅ Implemented (Phase 5–6)                                                                  |
| `/klasse/[classSlug]/aufgaben`, `/klasse/[classSlug]/termine`, `/klasse/[classSlug]/dateien`, `/klasse/[classSlug]/ankuendigungen` | Not separate routes yet — covered via `/home/*` + class filters, or pending Cloud (dateien) |
| `/ki`, `/ki/[conversationId]`                                                                                                      | ✅ Implemented (Phase 14)                                                                   |
| `/profil`                                                                                                                          | ✅ Implemented                                                                              |
| `/einstellungen`, `/einstellungen/konto`, `/einstellungen/sicherheit`                                                              | ✅ Implemented                                                                              |
| `/benachrichtigungen`                                                                                                              | ✅ Implemented (Phase 15) — full notification history + mark-read                           |
| `/einstellungen/benachrichtigungen`                                                                                                | Not planned — no per-type preferences exist to configure; see `/benachrichtigungen` instead |
| `/admin`, `/admin/benutzer`, `/admin/schulen`, `/admin/schuljahre`, `/admin/klassen`                                               | ✅ Implemented (Phase 4–5)                                                                  |
| `/admin/logs`                                                                                                                      | ✅ Implemented                                                                              |
| `/admin/speicher`                                                                                                                  | ✅ Implemented                                                                              |
| `/admin/ki`                                                                                                                        | ✅ Implemented (Phase 14)                                                                   |
| `/admin/benutzer/[userId]`, `/admin/klassen/[classId]`                                                                             | ✅ Implemented                                                                              |
