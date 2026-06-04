import { FileBadge, Music, PackageCheck, ShieldCheck } from "lucide-react";
import { GameIcon } from "../components/GameIcon";

const creditGroups = [
  {
    title: "Icones",
    detail: "Game Icons via Iconify",
    license: "CC BY 3.0",
    href: "https://game-icons.net/",
    Icon: FileBadge,
  },
  {
    title: "Interface",
    detail: "Lucide React",
    license: "ISC",
    href: "https://lucide.dev/",
    Icon: PackageCheck,
  },
  {
    title: "Audio",
    detail: "Arquivos em public/sounds",
    license: "Ver origem dos arquivos adicionados ao projeto",
    href: null,
    Icon: Music,
  },
  {
    title: "Runtime visual",
    detail: "PixiJS, Motion, React Flow e Tone.js",
    license: "Bibliotecas open source usadas na experiencia",
    href: null,
    Icon: ShieldCheck,
  },
];

export const CreditsView = () => (
  <div className="view-grid view-grid-wide">
    <section className="content-panel span-all">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Licencas</p>
          <h1>Creditos</h1>
        </div>
        <GameIcon name="archive-register" size={34} />
      </div>
      <div className="credits-hero">
        <GameIcon name="checked-shield" size={42} />
        <div>
          <strong>Registro de assets e bibliotecas</strong>
          <p>
            Esta tela centraliza creditos visuais, sonoros e tecnicos para manter o projeto pronto para GitHub,
            deploy e testes externos.
          </p>
        </div>
      </div>
    </section>

    <section className="content-panel span-all">
      <div className="credits-grid">
        {creditGroups.map(({ title, detail, license, href, Icon }) => (
          <article className="credit-card" key={title}>
            <Icon size={22} />
            <div>
              <strong>{title}</strong>
              <span>{detail}</span>
              <small>{license}</small>
            </div>
            {href && (
              <a href={href} target="_blank" rel="noreferrer">
                Abrir fonte
              </a>
            )}
          </article>
        ))}
      </div>
    </section>

    <section className="content-panel span-all">
      <div className="license-note">
        <GameIcon name="scroll-unfurled" size={30} />
        <div>
          <strong>Nota sobre sons</strong>
          <p>
            Se os efeitos sonoros vierem de bibliotecas externas, vale manter a fonte/licenca anotada junto dos
            arquivos ou em uma futura tabela de creditos. Isso evita dor de cabeca antes de publicar o app.
          </p>
        </div>
      </div>
    </section>
  </div>
);
