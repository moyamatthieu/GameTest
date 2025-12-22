import { Stats, Inventory, InventoryItem, World, NPC, ITEMS, CHAT_MESSAGE, ChatMessage, Identity, Equipment, EquipmentSlot, canEquip, Item } from 'shared';
import { InputHandler } from '../engine/InputHandler';

export class UIManager {
    private world: World;
    private socket: any;
    private inputHandler: InputHandler;

    // Drag and Drop State
    private isDragging: boolean = false;
    private draggedItem: { itemId: string, slotType: string, slotId: string | number } | null = null;
    private dragProxy: HTMLElement | null = null;
    private dragStartPos: { x: number, y: number } = { x: 0, y: 0 };
    private readonly DRAG_THRESHOLD = 5;

    // Elements
    private playerHpBar: HTMLElement;
    private playerHpText: HTMLElement;
    private playerMpBar: HTMLElement;
    private playerMpText: HTMLElement;
    private playerStaminaBar: HTMLElement;
    private playerStaminaText: HTMLElement;
    private targetHud: HTMLElement;
    private targetName: HTMLElement;
    private targetHpBar: HTMLElement;
    private targetHpText: HTMLElement;
    private chatMessages: HTMLElement;
    private chatInput: HTMLInputElement;
    private combatLog: HTMLElement;
    private inventoryWindow: HTMLElement;
    private inventoryGrid: HTMLElement;
    private characterWindow: HTMLElement;
    private statAttack: HTMLElement;
    private statDefense: HTMLElement;
    private statSpeed: HTMLElement;

    constructor(world: World, socket: any, inputHandler: InputHandler) {
        this.world = world;
        this.socket = socket;
        this.inputHandler = inputHandler;

        // Initialize elements
        this.playerHpBar = document.getElementById('player-hp-bar')!;
        this.playerHpText = document.getElementById('player-hp-text')!;
        this.playerMpBar = document.getElementById('player-mp-bar')!;
        this.playerMpText = document.getElementById('player-mp-text')!;
        this.playerStaminaBar = document.getElementById('player-stamina-bar')!;
        this.playerStaminaText = document.getElementById('player-stamina-text')!;
        this.targetHud = document.getElementById('target-hud')!;
        this.targetName = document.getElementById('target-name')!;
        this.targetHpBar = document.getElementById('target-hp-bar')!;
        this.targetHpText = document.getElementById('target-hp-text')!;
        this.chatMessages = document.getElementById('chat-messages')!;
        this.chatInput = document.getElementById('chat-input') as HTMLInputElement;
        this.combatLog = document.getElementById('combat-messages')!;
        this.inventoryWindow = document.getElementById('inventory-window')!;
        this.inventoryGrid = document.getElementById('inventory-grid')!;
        this.characterWindow = document.getElementById('character-window')!;
        this.statAttack = document.getElementById('stat-attack')!;
        this.statDefense = document.getElementById('stat-defense')!;
        this.statSpeed = document.getElementById('stat-speed')!;

        this.setupEventListeners();
        this.setupDragAndDropHandlers();
    }

    private setupEventListeners() {
        // Chat input
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = this.chatInput.value.trim();
                if (text) {
                    this.socket.emit(CHAT_MESSAGE, { text });
                    this.chatInput.value = '';
                }
                this.chatInput.blur();
            }
        });

        // Global key listeners for UI
        window.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                if (document.activeElement !== this.chatInput) {
                    this.toggleInventory();
                }
            }
            if (e.key === 'p' || e.key === 'P') {
                if (document.activeElement !== this.chatInput) {
                    this.toggleCharacter();
                }
            }
            if (e.key === 'Enter') {
                if (document.activeElement !== this.chatInput) {
                    this.chatInput.focus();
                }
            }
        });

        // Close buttons
        document.getElementById('close-inventory')?.addEventListener('click', () => {
            this.toggleInventory(false);
        });
        document.getElementById('close-character')?.addEventListener('click', () => {
            this.toggleCharacter(false);
        });
    }

    private setupDragAndDropHandlers() {
        this.inputHandler.onMouseDown((e) => this.handleMouseDown(e));
        this.inputHandler.onMouseMove((e) => this.handleMouseMove(e));
        this.inputHandler.onMouseUp((e) => this.handleMouseUp(e));
    }

    private handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        
        // Z-Index Management: Bring clicked window to front
        const windowElem = target.closest('.ui-window') as HTMLElement;
        if (windowElem) {
            this.bringToFront(windowElem);
        }

        const slot = target.closest('[data-slot-type]') as HTMLElement;
        if (slot) {
            const slotType = slot.getAttribute('data-slot-type')!;
            const slotId = slot.getAttribute('data-slot-id')!;
            const itemId = slot.getAttribute('data-item-id');

            if (itemId) {
                // Right click to quickly equip/use
                if (e.button === 2) {
                    e.preventDefault();
                    this.socket.emit('USE_ITEM', { itemId });
                    return;
                }
                
                this.draggedItem = { itemId, slotType, slotId };
                this.dragStartPos = { x: e.clientX, y: e.clientY };
            }
        }
    }

    private handleMouseMove(e: MouseEvent) {
        if (!this.draggedItem) return;

        if (!this.isDragging) {
            const dx = e.clientX - this.dragStartPos.x;
            const dy = e.clientY - this.dragStartPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > this.DRAG_THRESHOLD) {
                this.startDragging(e);
            }
        }

        if (this.isDragging && this.dragProxy) {
            this.dragProxy.style.left = `${e.clientX}px`;
            this.dragProxy.style.top = `${e.clientY}px`;
        }
    }

    private handleMouseUp(e: MouseEvent) {
        if (!this.isDragging) {
            this.draggedItem = null;
            return;
        }

        this.stopDragging(e);
    }

    private startDragging(e: MouseEvent) {
        this.isDragging = true;
        
        // Create Drag Proxy
        this.dragProxy = document.createElement('div');
        this.dragProxy.className = 'drag-proxy';
        this.dragProxy.style.position = 'fixed';
        this.dragProxy.style.pointerEvents = 'none';
        this.dragProxy.style.zIndex = '9999';
        this.dragProxy.style.width = '40px';
        this.dragProxy.style.height = '40px';
        this.dragProxy.style.opacity = '0.7';
        this.dragProxy.style.backgroundColor = this.getItemColor(this.draggedItem!.itemId);
        this.dragProxy.style.left = `${e.clientX}px`;
        this.dragProxy.style.top = `${e.clientY}px`;
        this.dragProxy.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(this.dragProxy);

        // Optional: Hide original icon or add class
    }

    private stopDragging(e: MouseEvent) {
        // Raycasting UI to find drop target
        this.dragProxy?.remove();
        this.dragProxy = null;

        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        const dropSlot = target?.closest('[data-slot-type]') as HTMLElement;

        if (dropSlot && this.draggedItem) {
            const toSlotType = dropSlot.getAttribute('data-slot-type')!;
            const toSlotId = dropSlot.getAttribute('data-slot-id')!;

            // Validation
            let valid = true;
            if (toSlotType === 'equipment') {
                const item = ITEMS[this.draggedItem.itemId];
                if (!item || !canEquip(item, toSlotId as EquipmentSlot)) {
                    valid = false;
                }
            }

            if (valid) {
                this.socket.emit('MOVE_ITEM', {
                    from: { type: this.draggedItem.slotType, id: this.draggedItem.slotId },
                    to: { type: toSlotType, id: toSlotId }
                });
            }
        }

        this.isDragging = false;
        this.draggedItem = null;
    }

    private bringToFront(windowElem: HTMLElement) {
        const windows = document.querySelectorAll('.ui-window');
        let maxZ = 100;
        windows.forEach(w => {
            const z = parseInt((w as HTMLElement).style.zIndex) || 100;
            if (z > maxZ) maxZ = z;
        });
        windowElem.style.zIndex = (maxZ + 1).toString();
    }

    public updatePlayerStats(stats: Stats) {
        const hpPercent = (stats.hp / stats.maxHp) * 100;
        this.playerHpBar.style.width = `${hpPercent}%`;
        this.playerHpText.innerText = `HP: ${Math.ceil(stats.hp)}/${stats.maxHp}`;

        const mpPercent = (stats.mana / stats.maxMana) * 100;
        this.playerMpBar.style.width = `${mpPercent}%`;
        this.playerMpText.innerText = `MP: ${Math.ceil(stats.mana)}/${stats.maxMana}`;

        const staminaPercent = (stats.stamina / stats.maxStamina) * 100;
        this.playerStaminaBar.style.width = `${staminaPercent}%`;
        this.playerStaminaText.innerText = `SP: ${Math.ceil(stats.stamina)}/${stats.maxStamina}`;

        // Update character sheet stats
        this.statAttack.innerText = `Attaque: ${stats.attackPower}`;
        this.statDefense.innerText = `Défense: ${stats.defense}`;
        this.statSpeed.innerText = `Vitesse: ${stats.moveSpeed}`;
    }

    public updateTarget(targetId: string | null) {
        if (!targetId) {
            this.targetHud.classList.add('hidden');
            return;
        }

        const stats = this.world.getComponent(targetId, Stats) as Stats;
        const npc = this.world.getComponent(targetId, NPC) as NPC;
        const identity = this.world.getComponent(targetId, Identity) as Identity;

        if (stats) {
            this.targetHud.classList.remove('hidden');
            if (identity) {
                this.targetName.innerText = identity.fullName;
            } else {
                this.targetName.innerText = npc ? npc.name : `Joueur ${targetId.substring(0, 5)}`;
            }
            const hpPercent = (stats.hp / stats.maxHp) * 100;
            this.targetHpBar.style.width = `${hpPercent}%`;
            this.targetHpText.innerText = `${Math.ceil(stats.hp)}/${stats.maxHp}`;
        } else {
            this.targetHud.classList.add('hidden');
        }
    }

    public addChatMessage(sender: string, text: string, isSystem: boolean = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        
        if (isSystem) {
            msgDiv.innerHTML = `<span class="system">${text}</span>`;
        } else {
            msgDiv.innerHTML = `<span class="sender">${sender}:</span> <span class="text">${text}</span>`;
        }

        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    public addCombatLog(text: string, type: 'damage' | 'heal' | 'info' = 'info') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `combat-msg ${type}`;
        msgDiv.innerText = text;

        this.combatLog.appendChild(msgDiv);
        
        // Keep only last 20 messages
        while (this.combatLog.children.length > 20) {
            this.combatLog.removeChild(this.combatLog.firstChild!);
        }
    }

    public updateInventory(inventory: Inventory) {
        this.inventoryGrid.innerHTML = '';
        
        // Create 20 slots
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.setAttribute('data-slot-type', 'inventory');
            slot.setAttribute('data-slot-id', i.toString());
            
            const invItem = inventory.items[i];
            if (invItem) {
                const itemDef = ITEMS[invItem.itemId];
                slot.setAttribute('data-item-id', invItem.itemId);
                slot.innerHTML = `
                    <div class="item-icon">${this.getItemIconSVG(invItem.itemId)}</div>
                    ${invItem.quantity > 1 ? `<div class="item-count">${invItem.quantity}</div>` : ''}
                `;
                slot.title = itemDef ? itemDef.name : invItem.itemId;
            }
            
            this.inventoryGrid.appendChild(slot);
        }
    }

    private getItemIconSVG(itemId: string): string {
        const color = this.getItemColor(itemId);
        if (itemId.includes('sword')) {
            return `<svg viewBox="0 0 100 100"><path d="M20,80 L40,60 M35,55 L80,10 M30,50 L50,70" stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round"/></svg>`;
        }
        if (itemId.includes('shield')) {
            return `<svg viewBox="0 0 100 100"><path d="M20,20 Q50,10 80,20 Q85,50 50,90 Q15,50 20,20" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
        }
        if (itemId.includes('potion')) {
            return `<svg viewBox="0 0 100 100"><path d="M40,20 L60,20 L60,40 Q80,40 80,70 Q80,90 50,90 Q20,90 20,70 Q20,40 40,40 Z" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
        }
        if (itemId.includes('wood')) {
            return `<svg viewBox="0 0 100 100"><rect x="20" y="40" width="60" height="20" rx="5" fill="${color}" transform="rotate(-45 50 50)"/></svg>`;
        }
        if (itemId.includes('iron')) {
            return `<svg viewBox="0 0 100 100"><path d="M30,30 L70,30 L80,70 L20,70 Z" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
        }
        return `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="50" height="50" fill="${color}"/></svg>`;
    }

    private getItemColor(itemId: string): string {
        if (itemId.includes('potion')) return '#e74c3c';
        if (itemId.includes('sword')) return '#95a5a6';
        if (itemId.includes('shield')) return '#3498db';
        if (itemId.includes('wood')) return '#d35400';
        if (itemId.includes('iron')) return '#7f8c8d';
        return '#7f8c8d';
    }

    public toggleInventory(force?: boolean) {
        if (force !== undefined) {
            if (force) {
                this.inventoryWindow.classList.remove('hidden');
                this.bringToFront(this.inventoryWindow);
                if (document.pointerLockElement) document.exitPointerLock();
            }
            else this.inventoryWindow.classList.add('hidden');
        } else {
            this.inventoryWindow.classList.toggle('hidden');
            if (!this.inventoryWindow.classList.contains('hidden')) {
                this.bringToFront(this.inventoryWindow);
                if (document.pointerLockElement) document.exitPointerLock();
            }
        }
    }

    public toggleCharacter(force?: boolean) {
        if (force !== undefined) {
            if (force) {
                this.characterWindow.classList.remove('hidden');
                this.bringToFront(this.characterWindow);
                if (document.pointerLockElement) document.exitPointerLock();
            }
            else this.characterWindow.classList.add('hidden');
        } else {
            this.characterWindow.classList.toggle('hidden');
            if (!this.characterWindow.classList.contains('hidden')) {
                this.bringToFront(this.characterWindow);
                if (document.pointerLockElement) document.exitPointerLock();
            }
        }
    }

    public updateEquipment(equipment: Equipment) {
        for (const slotKey in equipment.slots) {
            const slotType = slotKey as EquipmentSlot;
            const itemId = equipment.slots[slotType];
            const slotElem = document.getElementById(`slot-${slotType}`);
            const iconElem = document.getElementById(`icon-${slotType}`);
            
            if (slotElem) {
                slotElem.setAttribute('data-slot-type', 'equipment');
                slotElem.setAttribute('data-slot-id', slotType);
                if (itemId) {
                    slotElem.setAttribute('data-item-id', itemId);
                } else {
                    slotElem.removeAttribute('data-item-id');
                }
            }

            if (iconElem) {
                if (itemId) {
                    const item = ITEMS[itemId];
                    iconElem.innerHTML = this.getItemIconSVG(itemId);
                    iconElem.title = item ? item.name : itemId;
                    iconElem.style.backgroundColor = 'transparent';
                } else {
                    iconElem.innerHTML = '';
                    iconElem.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    iconElem.title = 'Vide';
                }
            }
        }
    }
}
