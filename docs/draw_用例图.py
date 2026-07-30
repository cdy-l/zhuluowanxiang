import matplotlib
import matplotlib.font_manager as fm
import os, sys

# Clear font cache and use Microsoft YaHei
cache_dir = matplotlib.get_cachedir()
cache_file = os.path.join(cache_dir, 'fontlist-v330.json')
if os.path.exists(cache_file):
    os.remove(cache_file)
fm._load_fontmanager(try_read_cache=False)
fm.fontManager.addfont(r'C:\Windows\Fonts\msyhbd.ttc')
matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei']
matplotlib.rcParams['axes.unicode_minus'] = False

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(14, 10), facecolor='#0a0e1a')
ax.set_facecolor('#0a0e1a')
ax.set_xlim(0, 1400)
ax.set_ylim(0, 900)
ax.axis('off')

# Title
ax.text(700, 870, '蛛罗万象 — 系统用例图', fontsize=18, fontweight='bold',
        color='#00d4ff', ha='center', va='center', fontfamily='sans-serif')

# =========== SYSTEM BOUNDARY ===========
sys_boundary = mpatches.FancyBboxPatch((20, 20), 1360, 820, boxstyle="round,pad=8",
                                         ec='#00d4ff', fc='none', linestyle='--', linewidth=2)
ax.add_patch(sys_boundary)
ax.text(40, 810, '蛛罗万象 系统边界', fontsize=12, color='#00d4ff',
        fontweight='bold', fontfamily='sans-serif')

# =========== HELPER FUNCTIONS ===========
def draw_actor(ax, x, y, color, label, sublabel='', scale=1.0):
    s = scale
    head = plt.Circle((x, y + 30*s), 12*s, ec=color, fc='none', linewidth=2.5*s)
    body = plt.Line2D([x, x], [y, y + 20*s], color=color, linewidth=2.5*s)
    arms = plt.Line2D([x - 16*s, x + 16*s], [y + 18*s, y + 18*s], color=color, linewidth=2.5*s)
    ax.add_patch(head)
    ax.add_line(body)
    ax.add_line(arms)
    ax.text(x, y - 16*s, label, fontsize=12*s, fontweight='bold',
            color=color, ha='center', va='top', fontfamily='sans-serif')
    if sublabel:
        ax.text(x, y - 32*s, sublabel, fontsize=8*s, color='#94a3b8',
                ha='center', va='top', fontfamily='sans-serif')

def draw_uc(ax, x, y, text, color, bg=(1,1,1,0.04)):
    ellipse = mpatches.Ellipse((x, y), width=130, height=32,
                                ec=color, fc=bg, linewidth=1.5)
    ax.add_patch(ellipse)
    ax.text(x, y, text, fontsize=10, color='#e2e8f0',
            ha='center', va='center', fontfamily='sans-serif')

def draw_arrow(ax, x1, y1, x2, y2, color='#94a3b8', style='dashed', lw=1.5):
    dx, dy = x2 - x1, y2 - y1
    ax.annotate('', xy=(x2 - 0.1*dx, y2 - 0.1*dy), xytext=(x1 + 0.1*dx, y1 + 0.1*dy),
                arrowprops=dict(arrowstyle='->', color=color, linestyle=style, lw=lw))

def draw_line(ax, x1, y1, x2, y2, color='#94a3b8', lw=1.5):
    line = plt.Line2D([x1, x2], [y1, y2], color=color, linewidth=lw)
    ax.add_line(line)

# =========== COLUMN POSITIONS ===========
COL_VISITOR = 120
COL_USER = 500
COL_VIP = 920

# =========== ACTOR: 访客 ===========
draw_actor(ax, COL_VISITOR, 740, '#4a6fa5', '访客')
draw_uc(ax, COL_VISITOR, 660, '浏览首页', '#4a6fa5')
draw_uc(ax, COL_VISITOR, 610, '查看使用教程', '#4a6fa5')
draw_line(ax, COL_VISITOR, 720, COL_VISITOR, 678, '#4a6fa5')
draw_line(ax, COL_VISITOR, 678, COL_VISITOR, 628, '#4a6fa5')

# Inherit: 访客 → 普通用户 (dashed empty triangle)
draw_arrow(ax, COL_VISITOR + 80, 740, COL_USER - 30, 740, '#7c3aed', 'dashed')
ax.text((COL_VISITOR + COL_USER)//2, 725, '继承', fontsize=9, color='#7c3aed',
        ha='center', va='top', fontstyle='italic', fontfamily='sans-serif')

# =========== ACTOR: 普通用户 ===========
draw_actor(ax, COL_USER, 740, '#7c3aed', '普通用户')
draw_uc(ax, COL_USER, 660, '登录 / 注册', '#7c3aed')
draw_line(ax, COL_USER, 720, COL_USER, 678, '#7c3aed')

# Section label
ax.text(COL_USER, 630, '—— 免费工具 ——', fontsize=11, color='#7c3aed',
        ha='center', va='center', fontweight='bold', fontfamily='sans-serif')

user_ucs = [
    (COL_USER - 100, 580, '查看热搜热榜'),
    (COL_USER + 40, 580, '浏览影视资讯'),
    (COL_USER + 180, 580, 'Steam折扣查询'),
    (COL_USER - 100, 530, '商品比价'),
    (COL_USER + 40, 530, '随机点名'),
    (COL_USER + 180, 530, '历史上的今天'),
    (COL_USER - 30, 480, '玩小游戏合集'),
    (COL_USER + 120, 480, '管理个人信息'),
]
for ux, uy, ut in user_ucs:
    draw_uc(ax, ux, uy, ut, '#7c3aed')

# Inherit: 普通用户 → VIP用户
draw_arrow(ax, COL_USER + 80, 740, COL_VIP - 30, 740, '#f59e0b', 'dashed')
ax.text((COL_USER + COL_VIP)//2, 725, '继承', fontsize=9, color='#f59e0b',
        ha='center', va='top', fontstyle='italic', fontfamily='sans-serif')

# =========== ACTOR: VIP用户 ===========
draw_actor(ax, COL_VIP, 740, '#f59e0b', 'VIP用户')
draw_line(ax, COL_VIP, 720, COL_VIP, 678, '#f59e0b')

# Section label
ax.text(COL_VIP, 650, '—— VIP专属功能 ——', fontsize=11, color='#f59e0b',
        ha='center', va='center', fontweight='bold', fontfamily='sans-serif')

vip_ucs = [
    (COL_VIP, 600, 'AI智能对话'),
    (COL_VIP, 555, '破解VIP视频'),
    (COL_VIP, 510, '搜索/播放VIP音乐'),
    (COL_VIP, 465, '爬取下载小说'),
    (COL_VIP, 420, '开通/管理VIP'),
]
for vx, vy, vt in vip_ucs:
    draw_uc(ax, vx, vy, vt, '#f59e0b')

# =========== ACTOR: 系统 ===========
draw_actor(ax, COL_VISITOR, 280, '#00d4ff', '系统', '(后端爬虫引擎)')

sys_ucs = [
    (COL_VISITOR, 200, '执行爬虫任务'),
    (COL_VISITOR + 140, 200, '调用网易云API'),
    (COL_VISITOR, 150, 'DeepSeek模型推理'),
    (COL_VISITOR + 140, 150, '数据存储与查询'),
]
for sx, sy, st in sys_ucs:
    draw_uc(ax, sx, sy, st, '#00d4ff', (0,0.83,1,0.05))
draw_line(ax, COL_VISITOR, 260, COL_VISITOR, 218, '#00d4ff')
draw_line(ax, COL_VISITOR, 218, COL_VISITOR + 140, 218, '#00d4ff')

# =========== LEGEND ===========
legend_x, legend_y = 1050, 200
legend_bg = mpatches.FancyBboxPatch((legend_x, legend_y), 250, 150,
                                      boxstyle="round,pad=6", ec='#333',
                                      fc='#111827', linewidth=1)
ax.add_patch(legend_bg)
ax.text(legend_x + 125, legend_y + 140, '图例', fontsize=11, fontweight='bold',
        color='#e2e8f0', ha='center', va='center', fontfamily='sans-serif')

# Actor legend
actor_head = plt.Circle((legend_x + 25, legend_y + 110), 6, ec='#e2e8f0', fc='none', linewidth=2)
actor_arms = plt.Line2D([legend_x + 12, legend_x + 38], [legend_y + 114, legend_y + 114], color='#e2e8f0', linewidth=2)
actor_body = plt.Line2D([legend_x + 25, legend_x + 25], [legend_y + 100, legend_y + 108], color='#e2e8f0', linewidth=2)
ax.add_patch(actor_head)
ax.add_line(actor_arms)
ax.add_line(actor_body)
ax.text(legend_x + 50, legend_y + 112, '参与者（角色）', fontsize=9, color='#94a3b8',
        ha='left', va='center', fontfamily='sans-serif')

# UC legend
uc_leg = mpatches.Ellipse((legend_x + 30, legend_y + 78), width=50, height=16,
                           ec='#4a6fa5', fc='none', linewidth=1.5)
ax.add_patch(uc_leg)
ax.text(legend_x + 55, legend_y + 78, '功能用例', fontsize=9, color='#94a3b8',
        ha='left', va='center', fontfamily='sans-serif')

# Inherit legend
draw_line(ax, legend_x + 15, legend_y + 52, legend_x + 55, legend_y + 52, '#94a3b8', 2)
ax.text(legend_x + 70, legend_y + 52, '继承关系（泛化）', fontsize=9, color='#94a3b8',
        ha='left', va='center', fontfamily='sans-serif')

# System boundary legend
sb_leg = mpatches.FancyBboxPatch((legend_x + 10, legend_y + 28), width=50, height=16,
                                   boxstyle="round,pad=3", ec='#00d4ff',
                                   fc='none', linestyle='--', linewidth=1.5)
ax.add_patch(sb_leg)
ax.text(legend_x + 75, legend_y + 36, '系统边界', fontsize=9, color='#94a3b8',
        ha='left', va='center', fontfamily='sans-serif')

# =========== SAVE ===========
plt.tight_layout()
out = os.path.join(os.path.dirname(__file__), "用例图.png")
plt.savefig(out, dpi=150, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
print("OK: 用例图.png created")
