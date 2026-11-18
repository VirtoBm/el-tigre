# El Tigre - Adventures

Roguelike de ação 3D visto de cima (estilo Hades, visual low-poly inspirado em Tunic) em Montería, Colômbia. A campanha percorre a entrada e o interior arborizado da praça rumo ao portão da escola, com confronto contra El Reyna, uma breve investida do exército e desfecho com a Tia.

## Jogar
Abra `el-tigre-adventures.html` em qualquer navegador moderno (Chrome, Edge, Firefox). Arquivo único, funciona offline.

## Controles
| Ação | Tecla |
|---|---|
| Mover | WASD / setas |
| Mirar | Mouse |
| Ataque | Clique esquerdo / J |
| Especial da arma | Clique direito / K (se disponível) |
| Esquiva | Espaço / Shift |
| Trompo (cast) | Q / L |
| Interagir (loja, fonte, estações do pátio) | E / Enter |
| Pausa / menu | Esc / P |
| Som | M |

O jogo também aceita controles compatíveis com a Gamepad API: analógico esquerdo move, analógico direito mira (com mira assistida opcional), A interage/confirma, X ataca, B ativa o especial, Y usa o trompo, LB/RB/LT/RT esquivam e Start pausa. No pátio inicial, o analógico anda, A usa a estação mais próxima, Select abre o menu e Start vai direto para a partida; o controle é detectado automaticamente e usa zona morta nos analógicos. Todos os menus (título, pausa, bênçãos, configurações, fim de partida) navegam por teclado, mouse ou controle, e os ícones de botão no HUD acompanham o último dispositivo usado.

O jogo começa no **Pátio de Treino**, um hub 3D inspirado na sala de treinamento de Hades: você anda pelo pátio com o personagem atual e tudo é físico na cena. Os sete heróis ficam em pedestais à esquerda, as armas em suportes à direita, o Cofrinho da Vó com as melhorias permanentes em mesinhas ao sul, a Arara de Fantasias com as skins ao noroeste e um boneco de treino ao nordeste para testar ataques e especiais. Chegue perto de uma estação e aperte E (ou A no controle) para escolher, equipar ou comprar; também é possível clicar ou tocar numa estação para o personagem caminhar até ela e usá-la, e no toque basta tocar ou arrastar no chão para andar. Para começar a partida, siga o tapete vermelho até o portão da praça ao norte.

O poder do personagem carrega após **15 segundos consecutivos sem sofrer dano** e dura 5 segundos: Jorgito se transforma em El Tigre; CrazyLeleo invoca exatamente cinco abelhas; Japa cria uma piscina e vira tubarão; Matheusinho entra no sedã, atrai os inimigos com ondas sonoras e os faz dançar; Vitão toca violão, atordoa e afasta todos os inimigos, e pode derrotar inimigos comuns com um golpe próximo enquanto se move (chefes não são eliminados pelo golpe); Bruno para o jogo para o VAR: um juiz com a camisa rubro-negra do Flamengo entra, revisa o monitor, apita, mostra o cartão vermelho e expulsa todos os inimigos para fora da tela, inclusive chefes (que são derrotados pelo fluxo normal da campanha), e a próxima onda só começa depois que o juiz sai; Thiagão para e solta um "$&#*" num balão de fala, e todos os inimigos, inclusive chefes, ficam congelados de constrangimento com a mão na boca por 5 segundos. Nos especiais em que o personagem fica parado (Bruno e Thiagão), o movimento e a esquiva do jogador ficam travados durante os 5 segundos. Vitão anda em passos lentos e flutuantes. O HUD mostra o tempo até o especial ficar pronto.

Cada personagem tem afinidade com uma arma: Jorgito com a bola, CrazyLeleo com a garrafa PET, Japa com o controle de PlayStation, Matheusinho com as luvas de boxe, Vitão com a lata de Kaiser, Bruno com a raquete de tênis e Thiagão com a coxa de frango. A combinação certa aumenta em **25% o dano dos ataques básicos daquela arma**; especiais, outras armas e aliados não recebem esse bônus. Todas as armas continuam disponíveis para todos os personagens. As luvas têm um combo de socos em arco; o indicador mostra o alcance e a abertura de cada golpe. O controle é arremessado como um bumerangue e pode atingir inimigos na ida e na volta; a lata causa dano em área ao pousar. A bola de tênis ricocheteia até três vezes nas paredes; ataque quando ela estiver ao alcance da raquete para rebatê-la em chamas, sem recuperar ricochetes. A coxa causa dano de impacto e veneno, e o inimigo atingido para brevemente para comer.

As quatro skins compradas com bolinhas de gude ficam na Arara de Fantasias do pátio (ela mostra a fantasia do personagem atual num manequim) e alteram o especial quando equipadas: Jorgito (120) dança K-pop e elimina inimigos comuns após a coreografia; CrazyLeleo (100) prende inimigos com mel por 5 segundos; Matheusinho (100) lança um skate bumerangue que marca os inimigos visíveis; Japa (100) lança uma boia que os puxa e causa dano em área. Chefes não sofrem eliminações instantâneas.

As ondas ficam mais numerosas e rápidas conforme você avança: são três ondas na entrada, quatro no interior da praça e três investidas do exército. Inimigos também ganham vida, velocidade e agressividade nas fases mais ao norte; gatos saltam, ciclistas investem, soldados alternam rajadas e granadas, e os chefes têm ataques próprios. El Reyna combina mordida, salto, uivo em ondas e varrida; abaixo de 42% da vida, acelera e o uivo atinge duas vezes. Os efeitos sonoros são sintetizados localmente, sem dependências externas.

## Interface, som e opções
- **Tela inicial** com a logo; qualquer tecla, clique ou botão entra no pátio.
- **HUD de combate**: retrato do personagem, vida com rastro de dano, medidor do poder (15s sem dano), cooldown do especial da arma e do trompo, cargas de esquiva, trilha dos 10 trechos da praça, contador de onda/inimigos restantes, pesos, bolinhas de gude e cronômetro. Inimigos feridos mostram uma barra de vida flutuante; chefes usam a barra no topo (com marcas das fases de El Reyna).
- **Pausa** com resumo da build, **Configurações** (volume geral, música e efeitos, tremor de tela, números de dano, mira assistida — tudo salvo no navegador) e tela de **Controles**. Desistir pede confirmação.
- **Game feel**: hit-stop, tremor de câmera suave, empurrão direcional, câmera que olha um pouco à frente da mira, zoom nos momentos fortes, câmera lenta no último golpe da sala, rastro fantasma na esquiva, buffer de comandos para esquiva/trompo, inimigos que se deformam ao apanhar e voam ao cair, moedas que saltam e são atraídas até você, mira no chão e vinheta pulsante com batimento quando a vida está baixa.
- **Áudio** 100% sintetizado: compressor, reverb de praça, panorâmica estéreo pela posição na tela, variação de timbre e trilha de cumbia que muda conforme o momento (título, pátio, combate, calmaria e um tema próprio para El Reyna), abafada nos menus.

## Músicas
- **Combate:** *Mi Nombre Es Jorge* é a trilha oficial. Ela toca **só durante o combate** (ondas, elite e chefe): ao começar a luta entra um trecho aleatório da música, cortado no compasso, e a cada ~19s (e a cada nova onda) o jogo troca para outro trecho com um crossfade, sem repetir os trechos recentes. Sala limpa, loja, fonte, menus e o pátio voltam à trilha calma.
- **Pátio:** *El Solitario* toca num **radinho de pilha** ao lado do tapete. O som passa por um filtro de rádio velho (graves cortados, médios estourados e um pouco de distorção, chiado, estalos e oscilação de pitch) e fica mais alto conforme você chega perto. Aperte E (ou A) perto dele para ligar/desligar. Ao sair do pátio o rádio se cala.
- Os arquivos originais ficam em `assets/audio/originals/`. O build embute as versões leves de `assets/audio/game/` (`combate.mp3` e `radio.mp3`, ~4,7 MB) no HTML, então o jogo continua em um arquivo só e funciona offline. Para trocar uma música, recodifique-a com `ffmpeg` e substitua o arquivo em `assets/audio/game/`; se o andamento mudar, ajuste `COMBAT_TRACK` em `src/00-settings.js`.

## Ritmo e equilíbrio
- As ondas chegam em grupos escalonados; a próxima começa quando sobra no máximo um inimigo da anterior, mantendo o combate fluindo.
- Inimigos derrubam pesos (chefes e elites pagam mais). A loja sempre oferece comida se você estiver ferido, e as saídas sugerem mais empanadas quando a vida está baixa.
- El Reyna tem 2250 de vida; a mordida que bate na parede deixa o chefe tonto por quase 1s, e a fase furiosa (abaixo de 42%) é anunciada.
- As regras de balanceamento ficam em `src/00-balance.js` e são cobertas por testes (`npm test`).

## Editar e recompilar
O código fica em `src/` (`template.html` + módulos `00`–`07`): `00-*` são regras puras testáveis (combate, pátio, balanceamento, configurações), `01-core` cuida de renderização e entrada, `01b-audio` do som, `02-world` do cenário, `03-models-fx` dos modelos e efeitos, `04-player`, `05-enemies`, `06-game` (fluxo, HUD e menus) e `07-hub` (pátio inicial). Para gerar o `el-tigre-adventures.html`:

```
npm install
npm run build
```

A logo original fica em `assets/el-tigre-logo.svg`; o build a incorpora ao HTML standalone para que o jogo continue funcionando offline.
