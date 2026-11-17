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
| Pausa | Esc / P |
| Som | M |

O jogo também aceita controles compatíveis com a Gamepad API: analógico esquerdo move, analógico direito mira, A interage/confirma, X ataca, B ativa o especial, Y usa o trompo, LB/RB esquivam e Start pausa ou inicia. No pátio inicial, o analógico anda, A usa a estação mais próxima e Start vai direto para a partida; o controle é detectado automaticamente e usa zona morta nos analógicos. Teclado e mouse continuam disponíveis.

O jogo começa no **Pátio de Treino**, um hub 3D inspirado na sala de treinamento de Hades: você anda pelo pátio com o personagem atual e tudo é físico na cena. Os sete heróis ficam em pedestais à esquerda, as armas em suportes à direita, o Cofrinho da Vó com as melhorias permanentes em mesinhas ao sul, a Arara de Fantasias com as skins ao noroeste e um boneco de treino ao nordeste para testar ataques e especiais. Chegue perto de uma estação e aperte E (ou A no controle) para escolher, equipar ou comprar; também é possível clicar ou tocar numa estação para o personagem caminhar até ela e usá-la, e no toque basta tocar ou arrastar no chão para andar. Para começar a partida, siga o tapete vermelho até o portão da praça ao norte.

O poder do personagem carrega após **15 segundos consecutivos sem sofrer dano** e dura 5 segundos: Jorgito se transforma em El Tigre; CrazyLeleo invoca exatamente cinco abelhas; Japa cria uma piscina e vira tubarão; Matheusinho entra no sedã, atrai os inimigos com ondas sonoras e os faz dançar; Vitão toca violão, atordoa e afasta todos os inimigos, e pode derrotar inimigos comuns com um golpe próximo enquanto se move (chefes não são eliminados pelo golpe); Bruno para o jogo para o VAR: um juiz com a camisa rubro-negra do Flamengo entra, revisa o monitor, apita, mostra o cartão vermelho e expulsa todos os inimigos para fora da tela, inclusive chefes (que são derrotados pelo fluxo normal da campanha), e a próxima onda só começa depois que o juiz sai; Thiagão para e solta um "$&#*" num balão de fala, e todos os inimigos, inclusive chefes, ficam congelados de constrangimento com a mão na boca por 5 segundos. Nos especiais em que o personagem fica parado (Bruno e Thiagão), o movimento e a esquiva do jogador ficam travados durante os 5 segundos. Vitão anda em passos lentos e flutuantes. O HUD mostra o tempo até o especial ficar pronto.

Cada personagem tem afinidade com uma arma: Jorgito com a bola, CrazyLeleo com a garrafa PET, Japa com o controle de PlayStation, Matheusinho com as luvas de boxe, Vitão com a lata de Kaiser, Bruno com a raquete de tênis e Thiagão com a coxa de frango. A combinação certa aumenta em **25% o dano dos ataques básicos daquela arma**; especiais, outras armas e aliados não recebem esse bônus. Todas as armas continuam disponíveis para todos os personagens. As luvas têm um combo de socos em arco; o indicador mostra o alcance e a abertura de cada golpe. O controle é arremessado como um bumerangue e pode atingir inimigos na ida e na volta; a lata causa dano em área ao pousar. A bola de tênis ricocheteia até três vezes nas paredes; ataque quando ela estiver ao alcance da raquete para rebatê-la em chamas, sem recuperar ricochetes. A coxa causa dano de impacto e veneno, e o inimigo atingido para brevemente para comer.

As quatro skins compradas com bolinhas de gude ficam na Arara de Fantasias do pátio (ela mostra a fantasia do personagem atual num manequim) e alteram o especial quando equipadas: Jorgito (120) dança K-pop e elimina inimigos comuns após a coreografia; CrazyLeleo (100) prende inimigos com mel por 5 segundos; Matheusinho (100) lança um skate bumerangue que marca os inimigos visíveis; Japa (100) lança uma boia que os puxa e causa dano em área. Chefes não sofrem eliminações instantâneas.

As ondas ficam mais numerosas e rápidas conforme você avança: são três ondas na entrada, quatro no interior da praça e três investidas do exército. Inimigos também ganham vida, velocidade e agressividade nas fases mais ao norte; gatos saltam, ciclistas investem, soldados alternam rajadas e granadas, e os chefes têm ataques próprios. El Reyna combina mordida, salto, uivo em ondas e varrida; abaixo de 42% da vida, acelera e o uivo atinge duas vezes. Os efeitos sonoros são sintetizados localmente, sem dependências externas.

## Editar e recompilar
O código fica em `src/` (`template.html` + módulos `00`–`07`; o pátio inicial fica em `07-hub.js`). Para gerar o `el-tigre-adventures.html`:

```
npm install
npm run build
```

A logo original fica em `assets/el-tigre-logo.svg`; o build a incorpora ao HTML standalone para que o jogo continue funcionando offline.
