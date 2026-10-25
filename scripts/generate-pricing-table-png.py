import os
from PIL import Image, ImageDraw, ImageFont

def create_table_png():
    # High resolution canvas (1920 x 1080 for 16:9 presentation slide)
    width = 1920
    height = 1080
    bg_color = (255, 255, 255) # Pure White
    text_color = (0, 0, 0) # Pure Black
    sub_color = (60, 60, 60) # Dark Charcoal
    line_color = (0, 0, 0) # Solid Black borders
    light_line = (180, 180, 180) # Light grey divider
    header_bg = (240, 240, 240) # Subtle grey table header
    highlight_bg = (248, 248, 248) # Zebra row

    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Load Windows fonts
    font_path_regular = "C:/Windows/Fonts/segoeui.ttf"
    font_path_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_path_semibold = "C:/Windows/Fonts/seguisb.ttf"

    title_font = ImageFont.truetype(font_path_bold, 36)
    subtitle_font = ImageFont.truetype(font_path_regular, 20)
    sec_title_font = ImageFont.truetype(font_path_bold, 22)
    th_font = ImageFont.truetype(font_path_bold, 17)
    td_font = ImageFont.truetype(font_path_regular, 16)
    td_bold = ImageFont.truetype(font_path_bold, 16)
    note_font = ImageFont.truetype(font_path_regular, 14)

    # 1. Header Section
    draw.text((80, 50), "CAREER-OS : TECH DEPLOYMENT, COST & PROFIT ANALYSIS", fill=text_color, font=title_font)
    draw.text((80, 100), "Comprehensive Financial Breakdown: AWS Cloud Hosting, Maintenance, University B2B (1,000 Students) & Individual B2C Pricing (INR ₹)", fill=sub_color, font=subtitle_font)
    draw.line([(80, 135), (width - 80, 135)], fill=line_color, width=3)

    # --- SECTION 1: AWS CLOUD INFRASTRUCTURE & MAINTENANCE (Left Side / Full Top) ---
    y = 155
    draw.text((80, y), "1. AWS TECH INFRASTRUCTURE & MAINTENANCE COST BREAKDOWN", fill=text_color, font=sec_title_font)
    y += 35

    # Table 1 dimensions
    t1_x = 80
    t1_w = width - 160 # 1760px wide
    t1_cols = [t1_x, t1_x + 360, t1_x + 880, t1_x + 1160, t1_x + t1_w]
    t1_headers = ["Infrastructure Component", "AWS Specification / Deployment Tier", "Monthly Cost (₹)", "Annual Cost (₹)"]

    # Header Row
    draw.rectangle([(t1_x, y), (t1_x + t1_w, y + 36)], fill=header_bg, outline=line_color, width=2)
    for i, h in enumerate(t1_headers):
        draw.text((t1_cols[i] + 15, y + 8), h, fill=text_color, font=th_font)
        if i > 0:
            draw.line([(t1_cols[i], y), (t1_cols[i], y + 36)], fill=line_color, width=2)

    rows_t1 = [
        ("Web Fullstack Server (Next.js)", "AWS EC2 t3.medium (2 vCPU, 4GB RAM) with Auto-Restart", "₹2,500 / mo", "₹30,000 / yr"),
        ("AI Microservice (FastAPI/TTS/STT)", "AWS EC2 c6i.xlarge (Compute Optimized 4 vCPU, 8GB RAM)", "₹10,000 / mo", "₹1,20,000 / yr"),
        ("Database Storage (PostgreSQL)", "AWS RDS PostgreSQL db.t3.small (SSD Multi-AZ Backup)", "₹2,900 / mo", "₹34,800 / yr"),
        ("Static Assets & Audio CDN", "AWS S3 + CloudFront Edge Caching (3D Models, Resumes, WAV)", "₹1,250 / mo", "₹15,000 / yr"),
        ("Domain, SSL, Route53 & Monitoring", "AWS Route 53, ACM SSL, Daily Automated Snapshots", "₹850 / mo", "₹10,200 / yr"),
        ("Ongoing Tech Maintenance & DevOps", "Security Patching, Server Tuning, Uptime Monitoring Support", "₹15,000 / mo", "₹1,80,000 / yr"),
        ("TOTAL TECH + MAINTENANCE COST", "Complete Shared Infrastructure for up to 50,000 Active Students", "₹32,500 / mo", "₹3,90,000 / yr")
    ]

    y += 36
    for idx, row in enumerate(rows_t1):
        is_total = (idx == len(rows_t1) - 1)
        row_bg = (230, 230, 230) if is_total else (highlight_bg if idx % 2 == 1 else bg_color)
        row_font = td_bold if is_total else td_font
        
        draw.rectangle([(t1_x, y), (t1_x + t1_w, y + 32)], fill=row_bg, outline=line_color, width=2 if is_total else 1)
        for i, val in enumerate(row):
            draw.text((t1_cols[i] + 15, y + 7), val, fill=text_color, font=row_font)
            if i > 0:
                draw.line([(t1_cols[i], y), (t1_cols[i], y + 32)], fill=line_color, width=2 if is_total else 1)
        y += 32

    y += 25

    # --- SECTION 2 & 3: SPLIT INTO TWO CARDS SIDE BY SIDE ---
    col_gap = 40
    card_w = (width - 160 - col_gap) // 2 # 860px each
    c1_x = 80
    c2_x = c1_x + card_w + col_gap

    # Left Box: University Model (1,000 Students)
    draw.text((c1_x, y), "2. UNIVERSITY SALE MODEL (1,000 STUDENTS)", fill=text_color, font=sec_title_font)
    draw.text((c2_x, y), "3. INDIVIDUAL STUDENT MODEL (DIRECT B2C)", fill=text_color, font=sec_title_font)
    y += 35

    # Card 1 Table (University)
    c1_cols = [c1_x, c1_x + 500, c1_x + card_w]
    c1_headers = ["Commercial Parameter", "Value / Financial Metric (₹)"]

    draw.rectangle([(c1_x, y), (c1_x + card_w, y + 36)], fill=header_bg, outline=line_color, width=2)
    draw.text((c1_cols[0] + 15, y + 8), c1_headers[0], fill=text_color, font=th_font)
    draw.line([(c1_cols[1], y), (c1_cols[1], y + 36)], fill=line_color, width=2)
    draw.text((c1_cols[1] + 15, y + 8), c1_headers[1], fill=text_color, font=th_font)

    rows_c1 = [
        ("Target Customer", "Engineering College (Final & Pre-Final Year)"),
        ("Student Cohort Size", "1,000 Students (Batch of 2026)"),
        ("Recommended Price to Charge", "₹5,00,000 / year (₹500 / student / year)"),
        ("Alternative Budget Entry Pricing", "₹3,50,000 / year (₹350 / student / year)"),
        ("Direct AWS Cloud Cost to Serve 1,000 Students", "₹25,000 / year (₹25 / student / year)"),
        ("Account Support & Verification Overhead", "₹15,000 / year"),
        ("Total Direct Cost to Deliver Service", "₹40,000 / year"),
        ("GROSS PROFIT PER UNIVERSITY", "₹4,60,000 / year (At ₹5 Lakh Price)"),
        ("NET PROFIT MARGIN (%)", "92.0% PROFIT MARGIN")
    ]

    # Card 2 Table (Individual Student)
    c2_cols = [c2_x, c2_x + 500, c2_x + card_w]
    c2_headers = ["Commercial Parameter", "Value / Financial Metric (₹)"]

    draw.rectangle([(c2_x, y), (c2_x + card_w, y + 36)], fill=header_bg, outline=line_color, width=2)
    draw.text((c2_cols[0] + 15, y + 8), c2_headers[0], fill=text_color, font=th_font)
    draw.line([(c2_cols[1], y), (c2_cols[1], y + 36)], fill=line_color, width=2)
    draw.text((c2_cols[1] + 15, y + 8), c2_headers[1], fill=text_color, font=th_font)

    rows_c2 = [
        ("Target Customer", "Individual Off-Campus / Independent Student"),
        ("Primary Product SKU", "Placement Season Pass (6-Month Access)"),
        ("Recommended Price to Charge", "₹1,199 one-time (Placement Season Pass)"),
        ("Alternative Monthly Pricing Option", "₹349 / month (30-Day Sprint Access)"),
        ("Direct AWS Compute & Storage Cost", "₹18 per student (Entire 6 months)"),
        ("Payment Gateway Fee (Razorpay 2%)", "₹24 per transaction"),
        ("Total Direct Cost per Student", "₹42 per student"),
        ("NET PROFIT PER INDIVIDUAL STUDENT", "₹1,157 per student (₹1,199 - ₹42)"),
        ("NET PROFIT MARGIN (%)", "96.5% PROFIT MARGIN")
    ]

    y_sub = y + 36
    for idx in range(len(rows_c1)):
        is_highlight = (idx >= len(rows_c1) - 2)
        row_bg = (230, 230, 230) if is_highlight else (highlight_bg if idx % 2 == 1 else bg_color)
        f_style = td_bold if is_highlight else td_font

        # Draw Left Card Row
        draw.rectangle([(c1_x, y_sub), (c1_x + card_w, y_sub + 32)], fill=row_bg, outline=line_color, width=2 if is_highlight else 1)
        draw.text((c1_cols[0] + 15, y_sub + 7), rows_c1[idx][0], fill=text_color, font=f_style)
        draw.line([(c1_cols[1], y_sub), (c1_cols[1], y_sub + 32)], fill=line_color, width=2 if is_highlight else 1)
        draw.text((c1_cols[1] + 15, y_sub + 7), rows_c1[idx][1], fill=text_color, font=f_style)

        # Draw Right Card Row
        draw.rectangle([(c2_x, y_sub), (c2_x + card_w, y_sub + 32)], fill=row_bg, outline=line_color, width=2 if is_highlight else 1)
        draw.text((c2_cols[0] + 15, y_sub + 7), rows_c2[idx][0], fill=text_color, font=f_style)
        draw.line([(c2_cols[1], y_sub), (c2_cols[1], y_sub + 32)], fill=line_color, width=2 if is_highlight else 1)
        draw.text((c2_cols[1] + 15, y_sub + 7), rows_c2[idx][1], fill=text_color, font=f_style)

        y_sub += 32

    # Bottom Summary Callout Banner
    y_footer = y_sub + 20
    draw.rectangle([(80, y_footer), (width - 80, y_footer + 58)], fill=(245, 245, 245), outline=line_color, width=2)
    draw.text((105, y_footer + 10), "KEY PROFITABILITY DRIVER : ZERO EXTERNAL AI API COSTS", fill=text_color, font=th_font)
    draw.text((105, y_footer + 32), "Because Piper TTS, faster-whisper, and MiniLM run on-premise without per-minute vendor fees, serving 1,000 students costs only ₹25/student, yielding >92% net margins.", fill=sub_color, font=note_font)

    # Save output
    os.makedirs("public", exist_ok=True)
    img.save("pricing-cost-profit-table.png", "PNG")
    img.save("public/pricing-cost-profit-table.png", "PNG")
    print("Black & white pricing table PNG generated successfully!")

if __name__ == "__main__":
    create_table_png()
