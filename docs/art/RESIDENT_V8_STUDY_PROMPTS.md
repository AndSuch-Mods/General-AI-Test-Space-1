# Resident v8 raster studies

Status: source-backed layers integrated and reviewed at native/display size. The original `public/art/residents-v2.png` is the identity and style reference. The user rejected the flatter code-drawn v7 resident as final artwork.

Created with the built-in imagegen tool on 2026-09-22. No external game artwork was supplied. Initial PNG studies contained baked checkerboard pixels. The targeted second alpha correction produced real RGBA, with78.2% fully transparent pixels and character interiors at alpha253–254. Native import clamps alpha to binary transparency. A browser encoding-only JPEG reference was needed because the image tool rejected two otherwise browser-readable PNG encodings. It did not repaint the character.

- `.local/art-studies/resident-v8-study.png`: initial male underlayer and finished female study; baked background, do not use directly.
- `.local/art-studies/resident-v8-study-alpha-attempt.png`: rejected first alpha correction.
- `.local/art-studies/resident-v8-study-normalized.png`: diagnostic PNG re-encoding only.
- `.local/art-studies/resident-v8-bases-alpha.png`: accepted transparent male underlayer/female complete-outfit study.
- `.local/art-studies/resident-v8-clean-bases-study.png`: male and female neutral underlayers before alpha extraction.
- `.local/art-studies/resident-v8-clean-bases-alpha.png`: transparent male and female neutral underlayers, using the same successful alpha correction prompt below.
- `.local/resident-v8-native-comparison.png`: original, male underlayer and matching female at32×48 native and64×96 actual display size, plus enlarged inspection.

The initial studies below preceded the completed interchangeable layer assembly recorded at the end of this document. Existing creation options and APIs are unchanged. Studies stay outside `public` so the offline build does not ship unused artwork. Work briefly paused for the published original-sprite eye correction, then resumed. The completed raster pipeline preserves that approved source face and complete matched open-eye cluster.

## Initial study prompt

```text
Use case: identity-preserve.
Asset type: original production RPG sprite character study, same game as the provided original sprite sheet.
Input image 1: ORIGINAL APPROVED IDENTITY AND STYLE ANCHOR. This is original project art. Preserve its exact face language, large brown expressive eyes with cream highlights, warm outlined skin planes, adult compact sprite proportions, finely shaded pixel clusters, sophisticated earthy shadows and highlights. Do not simplify into flat geometric doll art.

Create a TRUE TRANSPARENT ALPHA PNG sprite atlas with exactly 2 columns x3 rows, six full-body characters, comfortably separated and equal scale. No backdrop/checkerboard/shadows/text.
Rows: row1 front facing DOWN; row2 exact RIGHT side profile; row3 back facing UP.
COLUMN1: clean male base extracted from the supplied character: same original face/head/body proportions, short brown hair REMOVED to expose a clean scalp for separate future hair layers; remove coat, satchel and scarf. Opaque modest ivory fitted long-sleeved undershirt, charcoal trousers and the ORIGINAL brown leather boots. Calm adult figure. Keep naturally shaped arms, hands and shoulders, enough seam/shadow detail for a convincing game base, not anatomy diagram.
COLUMN2: finished FEMALE version of the original character, same facial/eye style, same height and pixel detail, softly feminine jaw and natural modest clothed chest/waist/hip contour. Long chestnut hair reaching upper back, ivory blouse, rich brown fitted short coat, warm amber scarf, knee-length umber skirt, charcoal leggings, the ORIGINAL brown leather boots. Natural connected garments, coherent layered construction, no pasted patches. Adult, modest, unsexualized. Same stance and proportions through all three directions.

Exact style match to input, rich but readable limited earthy pixel shading, hard pixel-art silhouettes, no smooth painted gradients, no vector art, no overly simple stick limbs, no cartoon redesign. Aim native32x48 pixel readability, shown enlarged8x with each logicalpixel a clean8pxsquare. Keep fullbody and boots inside eachcell; solesaligned across eachrow;headsameheight; headcenter/bodycenterregistered. Front twoeyes, profileoneeye andnosepointingright, backnoface. Same head and clothing in eachdirection. Original artwork only.
```

## First alpha correction prompt

```text
Use case: background-extraction.
EDIT the supplied sprite study. Remove ONLY the checkerboard background completely. Output a REAL RGBA PNG with actual transparent alpha outside the six characters. The checkerboard in the input is unwanted baked pixels, not desired art. Do not draw a checkerboard, floor, rectangle, white or black background, labels, or shadow. Retain each of the six sprites exactly: same faces, pixel colors, rich shading, clothes, scale, placement, hard silhouettes, no redesign. Preserve inner opaque highlights and dark outlines, and transparently cut empty gaps between legs/arms. Six isolated game sprites as original in2columns3rows. All outside pixels must have alpha0 and character pixels alpha255. Do not redraw faces or simplify shading.
```

## Successful alpha correction prompt

```text
Use case: background-extraction. Edit this exact six-sprite image. Preserve every sprite pixel, silhouette, face, hair, clothing, scale and position. Remove the entire gray-white checkerboard background, including empty gaps between legs and arms. Output TRUE transparent PNG RGBA, alpha 0 outside the sprites, not painted black, white, gray, or another checkerboard. Preserve dark outlines and the dark clothing interiors as fully opaque. This is alpha extraction only. Do not redraw or reinterpret any sprite. Do not resize. No new shadows. The output must be a transparent sprite sheet, not a visual simulation of transparency.
```

## Clean bases prompt

```text
Use case: precise-object-edit.
Input is the approved six-sprite character study,2columns3rows, with real transparency. Keep ALL exact positions, character heights, boot baselines, head placements, poses, facial features and pixel shading unchanged. Preserve every pixel of the LEFT male column.
ONLY edit RIGHT female column: remove all hair completely to expose naturally shaded bald scalp; remove amber scarf, brown coat and brown skirt. Under these put a simple opaque fitted ivory long-sleeved undershirt and charcoal fitted trousers, retaining the current natural modest female torso, waist and hips. Keep the female face, neck, hands, boots, proportions and exact pose unchanged. Adult fully clothed model-sheet base for interchangeable game clothing. No anatomy details, no nudity. Use the SAME shirt/trousers construction as left male column with naturally female fit.
The right column is a clean female underlayer, front/down, right/profile, back/up, registered pixel-for-pixel to the original right-column silhouette anchors. Do not make a new style, do not change head size or eye position.
Preserve TRUE TRANSPARENT RGBA. Alpha0 aroundsprites. No backdrop, no checkerboard, no glow, no shadows. Crisp richly shaded pixel art matching the original asset, not simple flat shapes. No text.
```


## Completed source-backed assembly

The resumed implementation uses the accepted raster layers and retains the approved original face and male coat gait. Native registration, material masks and composition are documented in `docs/ART_RESIDENT_V7.md`. Production source images are preserved under `docs/art/sources`; unused studies stay under `.local`, outside the offline cache.

Male wardrobe generation and both alpha retries retained a baked gray checkerboard. The importer removes that source's bright near-achromatic matte, thresholds alpha, and discards detached matte specks. Female wardrobe and hairstyle extraction produced real RGBA. The generated bald faces are alignment guides; runtime heads use the approved original face and its matched open-eye correction.

## Male wardrobe prompt

```text
Use case: identity-preserve. Production original RPG clothing sprite atlas.
Input1 is the original approved resident and exact art-style reference. Input2 has clean male/female bases; use LEFT MALE base only for anatomy.
Create exactly15 full-body bald MALE residents in a5columns×3rows sprite atlas, equal scale, fixedhead/neck/hip/soleanchors and generousemptyspace. Squarecanvas. All15are the SAME adult male base with the original expressive face, broad shoulders, originalheight/proportions and original warm finelyshaded pixel clusters. Skin warmpeach, nohair anywhere. The underlying body and boots neverchange. DO NOT simplify into flat vector or low-detail doll art.
Rows:1DOWN front,2RIGHT trueprofile,3UP back. Columns are outfits:
1original brown shortcoat, creamshirt, amberscarf, darktrousers, leatherboots;
2fitted umberbuttonedvest over creamlongsleevedshirt, darktrousers, sameboots;
3earthybrown beltedkneelengthtunic, long sleeves, charcoaltrousers,sameboots;
4modest earthybrown longsleeved belowkneelengthdress, highcreamcollar, charcoalleggings,sameboots;
5creamlongsleevedblouse tuckedinto earthybrown pleatedkneelengthskirt, charcoalleggings,sameboots.
Alloutfits available tomale, withnatural connectedtailoring, folds,seams, shadingandhighlights. Armsdown relaxed, handsjustbeyondcuffs, feetatrestsamepositions. No satchelor otheraccessories. No posevariationwithinrow. Fully clothed, nonsexual adult.
Eachsprite must remain legible when sampled32×48pixels. Detailedpixelart exactlymatching originalinput. Keepface/body/headplacementunchangedacrossoutfits. True transparent RGBAbackground, alpha0 around sprites. No checkerboard, glow,floor,shadow,labels. Exact15sprites,5columns3rows.
```

## Female wardrobe prompt

```text
Use case: identity-preserve. Production original RPG clothing sprite atlas.
Input1 is the original approved resident and exact art-style reference. Input2 has clean male/female bases; use RIGHT FEMALE base only for anatomy.
Create exactly15 full-body bald FEMALE residents in a5columns×3rows sprite atlas, equal scale, fixedhead/neck/hip/soleanchors and generousemptyspace. Squarecanvas. All15are the SAME adult female base with the original expressive face, softly feminine shoulders, natural modest clothed chest/waist/hips, originalheight/proportions and original warm finelyshaded pixel clusters. Skin warmpeach, nohair anywhere. The underlying body and boots neverchange. DO NOT simplify into flat vector or low-detail doll art.
Rows:1DOWN front,2RIGHT trueprofile,3UP back. Columns are outfits:
1original brown shortcoat, creamshirt, amberscarf, darktrousers, leatherboots;
2fitted umberbuttonedvest over creamlongsleevedshirt, darktrousers, sameboots;
3earthybrown beltedkneelengthtunic, long sleeves, charcoaltrousers,sameboots;
4modest earthybrown longsleeved belowkneelengthdress, highcreamcollar, charcoalleggings,sameboots;
5creamlongsleevedblouse tuckedinto earthybrown pleatedkneelengthskirt, charcoalleggings,sameboots.
Alloutfits available tofemale, withnatural connectedtailoring, folds,seams, shadingandhighlights. Armsdown relaxed, handsjustbeyondcuffs, feetatrestsamepositions. No satchelor otheraccessories. No posevariationwithinrow. Fully clothed, nonsexual adult.
Eachsprite must remain legible when sampled32×48pixels. Detailedpixelart exactlymatching originalinput. Keepface/body/headplacementunchangedacrossoutfits. True transparent RGBAbackground, alpha0 around sprites. No checkerboard, glow,floor,shadow,labels. Exact15sprites,5columns3rows.
```

## Hairstyle prompt

```text
Use case: identity-preserve. Original RPG modular hairstyle atlas.
Input1 is the exact approved original resident identity and pixel-art quality. Input2 provides clean bald male/female heads. Keep the same skull scale, face construction and deeply shaded chestnut pixels as the original.
Generate18 HEADS AND HAIR ONLY, exactly6columns×3rows, no bodies, shoulders, clothing or accessories. Leave neckends visible solely as alignmentguides. Allfaces remain the SAME original adult resident face, same skullshape andscale, sameeyeheightandheadcenter. Hairgoesoverthisunchangedhead; noface redesign.
Rows:1front DOWN,2trueRIGHTprofile,3backUP.
Columns:1SHORT tousledhair exactlylikeoriginal;2CROPPED close short masculinecut with visibleforehead;3SWEPT side-partedcut, neattaperedbackandaside fringe;4BOB jawlengthroundedbob;5LONG naturallayeredhair toshoulderblades;6BRAID a continuousbrownbraid toshoulderblades, withshortside strands.
All18 useCHESTNUT BROWN hair,richlyshadedclustersmatchingoriginal. Eachhairstylefits bothadultbodies. Long/braidhair extendsbelownecknaturally, nofloatingfragments. Frontview showsfaceandbothopeneyes;rightoneeye;upnoface. Everyrow consistentfacesize andneckanchor; allcrownsandeyeheights match, headsneverstretch.
Detailed original pixel art with earthy highlights, coherentlocks and cleanjaggedsilhouettes, notflatshapes orvector. Designed fornative32×48body where headoccupiesapproximately16×16pixels. Showlargecrisp8×pixelblocks. Transparent RGBAcanvas, alpha0 background, no checkerboard, no gray/white backdrop, no glow/shadows/labels.
```
